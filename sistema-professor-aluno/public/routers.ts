import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";

// Professor password - hardcoded for simplicity
const PROFESSOR_PASSWORD = "1234";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Custom auth for professor/student
  customAuth: router({
    loginProfessor: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const professor = await db.getProfessorByEmail(input.email);
        if (!professor || professor.password !== input.password) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha incorretos" });
        }
        // Create JWT token
        const token = jwt.sign(
          { role: "professor", professorId: professor.id, email: professor.email },
          ENV.cookieSecret,
          { expiresIn: "30d" }
        );
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, role: "professor", professor };
      }),
    
    registerProfessor: publicProcedure
      .input(z.object({ name: z.string(), email: z.string().email(), password: z.string() }))
      .mutation(async ({ input }) => {
        const existing = await db.getProfessorByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Email já cadastrado" });
        }
        await db.createProfessor(input);
        return { success: true };
      }),
    
    loginStudent: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const student = await db.getStudentByEmail(input.email);
        if (!student || student.password !== input.password) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha incorretos" });
        }
        // Create JWT token
        const token = jwt.sign(
          { role: "student", studentId: student.id, email: student.email },
          ENV.cookieSecret,
          { expiresIn: "30d" }
        );
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, role: "student", student };
      }),
    
    registerStudent: publicProcedure
      .input(z.object({ name: z.string(), email: z.string().email(), password: z.string() }))
      .mutation(async ({ input }) => {
        const existing = await db.getStudentByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Email já cadastrado" });
        }
        await db.createStudent({ ...input, studyCash: 0 });
        return { success: true };
      }),
    
    getSession: publicProcedure.query(({ ctx }) => {
      const token = ctx.req.cookies[COOKIE_NAME];
      if (!token) return null;
      try {
        const decoded = jwt.verify(token, ENV.cookieSecret) as any;
        return {
          role: decoded.role,
          studentId: decoded.studentId,
          professorId: decoded.professorId,
          email: decoded.email,
          student: decoded.studentId ? { id: decoded.studentId, email: decoded.email } : undefined,
        };
      } catch {
        return null;
      }
    }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
  }),

  // Students management
  students: router({
    
    list: publicProcedure.query(async () => {
      return await db.getAllStudents();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getStudentById(input.id);
      }),
  }),

  // Tasks management
  tasks: router({
    create: publicProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        reward: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.createTask(input);
        return { success: true };
      }),
    
    list: publicProcedure.query(async () => {
      return await db.getAllTasks();
    }),
    
    listActive: publicProcedure.query(async () => {
      return await db.getActiveTasks();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTaskById(input.id);
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        reward: z.number().optional(),
        status: z.enum(["active", "archived"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateTask(id, updates);
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTask(input.id);
        return { success: true };
      }),
  }),

  // Submissions management
  submissions: router({
    create: publicProcedure
      .input(z.object({
        taskId: z.number(),
        studentId: z.number(),
        answer: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Check if student already submitted
        const existing = await db.getStudentSubmissionForTask(input.studentId, input.taskId);
        if (existing) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Você já entregou esta tarefa" });
        }
        await db.createSubmission(input);
        return { success: true };
      }),
    
    listByTask: publicProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSubmissionsByTask(input.taskId);
      }),
    
    listByStudent: publicProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSubmissionsByStudent(input.studentId);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getSubmissionById(input.id);
      }),
    
    correct: publicProcedure
      .input(z.object({
        id: z.number(),
        feedback: z.string(),
        earnedCash: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.correctSubmission(input.id, input.feedback, input.earnedCash);
        return { success: true };
      }),
    
    listAll: publicProcedure.query(async () => {
      return await db.getAllSubmissions();
    }),
  }),
});

export type AppRouter = typeof appRouter;
