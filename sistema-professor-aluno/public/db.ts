  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students).where(eq(students.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllStudents() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(students).orderBy(desc(students.createdAt));
}

export async function getStudentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateStudentCash(id: number, amount: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const student = await getStudentById(id);
  if (!student) throw new Error("Student not found");
  await db.update(students).set({ studyCash: student.studyCash + amount }).where(eq(students.id, id));
}

// Tasks queries
export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tasks).values(task);
  return result;
}

export async function getAllTasks() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export async function getActiveTasks() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tasks).where(eq(tasks.status, "active")).orderBy(desc(tasks.createdAt));