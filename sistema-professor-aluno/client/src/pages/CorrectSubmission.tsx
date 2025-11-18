import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Award } from "lucide-react";

export default function CorrectSubmission() {
  const [, params] = useRoute("/professor/correct/:id");
  const [, setLocation] = useLocation();
  const submissionId = params?.id ? parseInt(params.id) : 0;

  const [feedback, setFeedback] = useState("");
  const [earnedCash, setEarnedCash] = useState(0);

  const submissionQuery = trpc.submissions.getById.useQuery({ id: submissionId });
  const taskQuery = trpc.tasks.getById.useQuery(
    { id: submissionQuery.data?.taskId || 0 },
    { enabled: !!submissionQuery.data?.taskId }
  );
  const studentQuery = trpc.students.getById.useQuery(
    { id: submissionQuery.data?.studentId || 0 },
    { enabled: !!submissionQuery.data?.studentId }
  );

  const correctSubmission = trpc.submissions.correct.useMutation({
    onSuccess: () => {
      toast.success("Tarefa corrigida com sucesso!");
      setLocation("/professor");
    },
    onError: () => {
      toast.error("Erro ao corrigir tarefa");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast.error("Adicione um feedback para o aluno");
      return;
    }
    correctSubmission.mutate({
      id: submissionId,
      feedback,
      earnedCash,
    });
  };

  if (submissionQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!submissionQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Submissão não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => setLocation("/professor")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Painel
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-3xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{taskQuery.data?.title || "Tarefa"}</CardTitle>
            <CardDescription>
              Aluno: {studentQuery.data?.name || "Carregando..."} •{" "}
              Enviado em: {new Date(submissionQuery.data.submittedAt).toLocaleString("pt-BR")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Descrição da Tarefa:</Label>
              <p className="mt-1 p-3 bg-muted rounded-md">{taskQuery.data?.description}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold">Resposta do Aluno:</Label>
              <p className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                {submissionQuery.data.answer}
              </p>
            </div>
            <div className="flex items-center gap-2 text-secondary">
              <Award className="w-5 h-5" />
              <span className="font-semibold">
                Recompensa máxima: {taskQuery.data?.reward || 0} StudyCash
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Correção</CardTitle>
            <CardDescription>
              Adicione um feedback e defina quantos StudyCash o aluno ganhou
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback para o aluno</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Escreva seu feedback sobre a tarefa..."
                  rows={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="earnedCash">StudyCash conquistado</Label>
                <Input
                  id="earnedCash"
                  type="number"
                  min="0"
                  max={taskQuery.data?.reward || 0}
                  value={earnedCash}
                  onChange={(e) => setEarnedCash(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Máximo: {taskQuery.data?.reward || 0} StudyCash
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={correctSubmission.isPending}
              >
                {correctSubmission.isPending ? "Salvando..." : "Salvar Correção"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
