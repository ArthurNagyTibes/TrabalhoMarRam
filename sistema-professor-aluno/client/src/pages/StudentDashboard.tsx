import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { LogOut, Award, ClipboardList, CheckCircle, Clock, Trophy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const [currentStudentId, setCurrentStudentId] = useState<number | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentCash, setStudentCash] = useState(0);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [answer, setAnswer] = useState("");

  const sessionQuery = trpc.customAuth.getSession.useQuery();

  const studentQuery = trpc.students.getById.useQuery(
    { id: currentStudentId || 0 },
    { enabled: !!currentStudentId }
  );

  useEffect(() => {
    if (sessionQuery.data?.studentId) {
      setCurrentStudentId(sessionQuery.data.studentId);
    }
  }, [sessionQuery.data?.studentId]);

  useEffect(() => {
    if (studentQuery.data) {
      setStudentName(studentQuery.data.name);
      setStudentCash(studentQuery.data.studyCash);
    }
  }, [studentQuery.data]);

  const logout = trpc.customAuth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logout realizado");
      setLocation("/");
    },
  });

  // Queries otimizadas
  const tasksQuery = trpc.tasks.listActive.useQuery();
  const submissionsQuery = trpc.submissions.listByStudent.useQuery(
    { studentId: currentStudentId || 0 },
    { enabled: !!currentStudentId }
  );

  const submitTask = trpc.submissions.create.useMutation({
    onSuccess: () => {
      toast.success("Tarefa enviada com sucesso!");
      setSelectedTask(null);
      setAnswer("");
      submissionsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      toast.error("Escreva sua resposta antes de enviar");
      return;
    }
    if (!currentStudentId || !selectedTask) return;

    submitTask.mutate({
      taskId: selectedTask.id,
      studentId: currentStudentId,
      answer,
    });
  };

  // Cálculos otimizados
  const submittedTaskIds = new Set(submissionsQuery.data?.map(s => s.taskId) || []);
  const availableTasks = tasksQuery.data?.filter(t => !submittedTaskIds.has(t.id)) || [];
  const completedSubmissions = submissionsQuery.data?.filter(s => s.status === "corrected") || [];
  const pendingSubmissions = submissionsQuery.data?.filter(s => s.status === "pending") || [];

  if (!currentStudentId || !studentQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Olá, {studentName}!
              </h1>
              <p className="text-sm text-muted-foreground">Painel do Aluno</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => logout.mutate()}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="w-4 h-4" />
                Saldo StudyCash
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{studentCash}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Tarefas Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{availableTasks.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Tarefas Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{completedSubmissions.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="available" className="space-y-6">
          <TabsList>
            <TabsTrigger value="available">Tarefas Disponíveis</TabsTrigger>
            <TabsTrigger value="pending">Aguardando Correção ({pendingSubmissions.length})</TabsTrigger>
            <TabsTrigger value="completed">Concluídas ({completedSubmissions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            <h2 className="text-2xl font-bold">Tarefas Disponíveis</h2>
            {tasksQuery.isLoading ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Carregando tarefas...
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {availableTasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle>{task.title}</CardTitle>
                      <CardDescription>{task.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-secondary">
                          <Award className="w-5 h-5" />
                          <span className="font-semibold text-lg">{task.reward} StudyCash</span>
                        </div>
                        <Button onClick={() => setSelectedTask(task)}>
                          Fazer Tarefa
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {availableTasks.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Nenhuma tarefa disponível no momento
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending">
            <h2 className="text-2xl font-bold mb-4">Aguardando Correção</h2>
            {submissionsQuery.isLoading ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Carregando...
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingSubmissions.map((submission) => {
                  const task = tasksQuery.data?.find(t => t.id === submission.taskId);
                  return (
                    <Card key={submission.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-muted-foreground" />
                          {task?.title || "Tarefa"}
                        </CardTitle>
                        <CardDescription>
                          Enviado em: {new Date(submission.submittedAt).toLocaleString("pt-BR")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Sua resposta:</Label>
                          <p className="p-3 bg-muted rounded-md whitespace-pre-wrap text-sm">
                            {submission.answer}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {pendingSubmissions.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Nenhuma tarefa aguardando correção
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            <h2 className="text-2xl font-bold mb-4">Tarefas Concluídas</h2>
            {submissionsQuery.isLoading ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Carregando...
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {completedSubmissions.map((submission) => {
                  const task = tasksQuery.data?.find(t => t.id === submission.taskId);
                  return (
                    <Card key={submission.id} className="border-l-4 border-l-secondary">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-secondary" />
                          {task?.title || "Tarefa"}
                        </CardTitle>
                        <CardDescription>
                          Corrigido em: {submission.correctedAt ? new Date(submission.correctedAt).toLocaleString("pt-BR") : ""}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-semibold">Sua resposta:</Label>
                          <p className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap text-sm">
                            {submission.answer}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Feedback do professor:</Label>
                          <p className="mt-1 p-3 bg-secondary/10 rounded-md whitespace-pre-wrap text-sm">
                            {submission.feedback}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-secondary">
                          <Award className="w-5 h-5" />
                          <span className="font-semibold text-lg">
                            Você ganhou: {submission.earnedCash} StudyCash
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {completedSubmissions.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Nenhuma tarefa concluída ainda
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>{selectedTask?.description}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-secondary">
              <Award className="w-5 h-5" />
              <span className="font-semibold">Recompensa: {selectedTask?.reward} StudyCash</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">Sua resposta</Label>
              <Textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Escreva sua resposta aqui..."
                rows={8}
                required
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedTask(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={submitTask.isPending}>
                {submitTask.isPending ? "Enviando..." : "Enviar Tarefa"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
