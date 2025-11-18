import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, LogOut, Users, ClipboardList, Award, Trash2, Archive } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfessorDashboard() {
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", reward: 0 });

  const logout = trpc.customAuth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logout realizado");
      setLocation("/");
    },
  });

  const tasksQuery = trpc.tasks.list.useQuery();
  const studentsQuery = trpc.students.list.useQuery();
  const submissionsQuery = trpc.submissions.listAll.useQuery();

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Tarefa criada com sucesso!");
      setIsCreateDialogOpen(false);
      setNewTask({ title: "", description: "", reward: 0 });
      tasksQuery.refetch();
    },
  });

  const deleteTask = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Tarefa excluída");
      tasksQuery.refetch();
    },
  });

  const archiveTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("Tarefa arquivada");
      tasksQuery.refetch();
    },
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.description) {
      toast.error("Preencha todos os campos");
      return;
    }
    createTask.mutate(newTask);
  };

  const pendingSubmissions = submissionsQuery.data?.filter(s => s.status === "pending") || [];
  const activeTasks = tasksQuery.data?.filter(t => t.status === "active") || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Painel do Professor</h1>
              <p className="text-sm text-muted-foreground">Sistema StudyCash</p>
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
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Tarefas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{activeTasks.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Alunos Cadastrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{studentsQuery.data?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="w-4 h-4" />
                Pendentes de Correção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{pendingSubmissions.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tasks">Tarefas</TabsTrigger>
            <TabsTrigger value="students">Alunos</TabsTrigger>
            <TabsTrigger value="submissions">Submissões</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gerenciar Tarefas</h2>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Tarefa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Tarefa</DialogTitle>
                    <DialogDescription>
                      Preencha os detalhes da tarefa e defina a recompensa em StudyCash
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="Ex: Exercícios de Matemática"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        placeholder="Descreva a tarefa em detalhes..."
                        rows={4}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reward">Recompensa (StudyCash)</Label>
                      <Input
                        id="reward"
                        type="number"
                        min="0"
                        value={newTask.reward}
                        onChange={(e) => setNewTask({ ...newTask, reward: parseInt(e.target.value) || 0 })}
                        placeholder="100"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={createTask.isPending}>
                      {createTask.isPending ? "Criando..." : "Criar Tarefa"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {tasksQuery.data?.map((task) => (
                <Card key={task.id} className={task.status === "archived" ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {task.title}
                          {task.status === "archived" && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                              Arquivada
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2">{task.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {task.status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => archiveTask.mutate({ id: task.id, status: "archived" })}
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
                              deleteTask.mutate({ id: task.id });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-secondary">
                      <Award className="w-5 h-5" />
                      <span className="font-semibold text-lg">{task.reward} StudyCash</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="students">
            <h2 className="text-2xl font-bold mb-4">Alunos Cadastrados</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {studentsQuery.data?.map((student) => (
                <Card key={student.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      {student.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-secondary">
                      <Award className="w-5 h-5" />
                      <span className="font-semibold">{student.studyCash} StudyCash</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="submissions">
            <h2 className="text-2xl font-bold mb-4">Submissões para Correção</h2>
            <div className="grid gap-4">
              {pendingSubmissions.map((submission) => {
                const task = tasksQuery.data?.find(t => t.id === submission.taskId);
                const student = studentsQuery.data?.find(s => s.id === submission.studentId);
                
                return (
                  <Card key={submission.id}>
                    <CardHeader>
                      <CardTitle>{task?.title || "Tarefa"}</CardTitle>
                      <CardDescription>
                        Aluno: {student?.name || "Desconhecido"} • Enviado em:{" "}
                        {new Date(submission.submittedAt).toLocaleString("pt-BR")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-semibold">Resposta do aluno:</Label>
                          <p className="mt-1 p-3 bg-muted rounded-md">{submission.answer}</p>
                        </div>
                        <Button
                          onClick={() => setLocation(`/professor/correct/${submission.id}`)}
                          className="w-full"
                        >
                          Corrigir Tarefa
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {pendingSubmissions.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Nenhuma submissão pendente de correção
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
