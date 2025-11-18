import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { GraduationCap, User } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  
  // Professor states
  const [professorEmail, setProfessorEmail] = useState("");
  const [professorPassword, setProfessorPassword] = useState("");
  const [isRegisteringProfessor, setIsRegisteringProfessor] = useState(false);
  const [professorName, setProfessorName] = useState("");
  
  // Student states
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [isRegisteringStudent, setIsRegisteringStudent] = useState(false);
  const [studentName, setStudentName] = useState("");

  const loginProfessor = trpc.customAuth.loginProfessor.useMutation({
    onSuccess: () => {
      toast.success("Login realizado com sucesso!");
      setLocation("/professor");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const registerProfessor = trpc.customAuth.registerProfessor.useMutation({
    onSuccess: () => {
      toast.success("Cadastro realizado! Faça login com suas credenciais.");
      setIsRegisteringProfessor(false);
      setProfessorName("");
      setProfessorEmail("");
      setProfessorPassword("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const loginStudent = trpc.customAuth.loginStudent.useMutation({
    onSuccess: () => {
      toast.success("Bem-vindo!");
      setLocation("/student");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const registerStudent = trpc.customAuth.registerStudent.useMutation({
    onSuccess: () => {
      toast.success("Cadastro realizado! Faça login com suas credenciais.");
      setIsRegisteringStudent(false);
      setStudentName("");
      setStudentEmail("");
      setStudentPassword("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleProfessorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegisteringProfessor) {
      if (professorPassword !== "1234") {
        toast.error("A senha do professor deve ser: 1234");
        return;
      }
      registerProfessor.mutate({ 
        name: professorName, 
        email: professorEmail, 
        password: professorPassword 
      });
    } else {
      loginProfessor.mutate({ email: professorEmail, password: professorPassword });
    }
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegisteringStudent) {
      registerStudent.mutate({ 
        name: studentName, 
        email: studentEmail, 
        password: studentPassword 
      });
    } else {
      loginStudent.mutate({ email: studentEmail, password: studentPassword });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-2">
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">Sistema StudyCash</CardTitle>
          <CardDescription className="text-base">
            Plataforma de tarefas e recompensas educacionais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="student" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Aluno
              </TabsTrigger>
              <TabsTrigger value="professor" className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Professor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="professor">
              <form onSubmit={handleProfessorSubmit} className="space-y-4">
                {isRegisteringProfessor && (
                  <div className="space-y-2">
                    <Label htmlFor="professorName">Nome Completo</Label>
                    <Input
                      id="professorName"
                      type="text"
                      placeholder="Digite seu nome"
                      value={professorName}
                      onChange={(e) => setProfessorName(e.target.value)}
                      required
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="professorEmail">Email</Label>
                  <Input
                    id="professorEmail"
                    type="email"
                    placeholder="seu@email.com"
                    value={professorEmail}
                    onChange={(e) => setProfessorEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="professorPassword">Senha</Label>
                  <Input
                    id="professorPassword"
                    type="password"
                    placeholder={isRegisteringProfessor ? "Digite: 1234" : "Digite sua senha"}
                    value={professorPassword}
                    onChange={(e) => setProfessorPassword(e.target.value)}
                    required
                  />
                  {isRegisteringProfessor && (
                    <p className="text-xs text-muted-foreground">
                      A senha do professor deve ser: <strong>1234</strong>
                    </p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginProfessor.isPending || registerProfessor.isPending}
                >
                  {isRegisteringProfessor 
                    ? (registerProfessor.isPending ? "Cadastrando..." : "Cadastrar")
                    : (loginProfessor.isPending ? "Entrando..." : "Entrar")
                  }
                </Button>
                
                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => {
                    setIsRegisteringProfessor(!isRegisteringProfessor);
                    setProfessorName("");
                    setProfessorEmail("");
                    setProfessorPassword("");
                  }}
                >
                  {isRegisteringProfessor 
                    ? "Já tem conta? Faça login" 
                    : "Primeiro acesso? Cadastre-se"
                  }
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="student">
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                {isRegisteringStudent && (
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Nome Completo</Label>
                    <Input
                      id="studentName"
                      type="text"
                      placeholder="Digite seu nome"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="studentEmail">Email</Label>
                  <Input
                    id="studentEmail"
                    type="email"
                    placeholder="seu@email.com"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentPassword">Senha</Label>
                  <Input
                    id="studentPassword"
                    type="password"
                    placeholder={isRegisteringStudent ? "Crie sua senha" : "Digite sua senha"}
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    required
                  />
                  {isRegisteringStudent && (
                    <p className="text-xs text-muted-foreground">
                      Escolha uma senha segura para sua conta
                    </p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginStudent.isPending || registerStudent.isPending}
                >
                  {isRegisteringStudent 
                    ? (registerStudent.isPending ? "Cadastrando..." : "Cadastrar")
                    : (loginStudent.isPending ? "Entrando..." : "Entrar")
                  }
                </Button>
                
                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => {
                    setIsRegisteringStudent(!isRegisteringStudent);
                    setStudentName("");
                    setStudentEmail("");
                    setStudentPassword("");
                  }}
                >
                  {isRegisteringStudent 
                    ? "Já tem conta? Faça login" 
                    : "Primeiro acesso? Cadastre-se"
                  }
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
