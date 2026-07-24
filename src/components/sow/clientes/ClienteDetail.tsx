import { useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShareBar } from "@/components/sow/shared/ShareBar";
import { InstituicoesPanel } from "@/components/sow/instituicoes/InstituicoesPanel";
import { AtivosTable } from "@/components/sow/ativos/AtivosTable";
import { AtivoFormDialog } from "@/components/sow/ativos/AtivoFormDialog";
import { ClienteTimeline } from "@/components/sow/timeline/ClienteTimeline";
import { EditClienteDialog } from "./EditClienteDialog";
import { useSoW } from "@/context/SoWContext";
import {
  useSoWCliente,
  useDeleteCliente,
  useInstituicaoInterna,
  useGerarAlertas,
  useGerarOportunidades,
  useGerarScore,
  useGerarBriefing,
} from "@/hooks/sow/useSoW";
import { formatBRLCompacto } from "@/lib/money";
import type { SoWClienteStatus } from "@/types/sow";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bell,
  Building2,
  Sparkles,
  Target,
  Gauge,
  FileText,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";

const STATUS_TONE: Record<SoWClienteStatus, string> = {
  Prospect: "bg-muted text-muted-foreground",
  Ativo: "bg-primary/10 text-primary",
  "Em Negociação": "bg-[hsl(38_92%_50%/0.12)] text-[hsl(38_92%_40%)]",
  Convertido:
    "bg-[hsl(142_71%_42%/0.12)] text-[hsl(142_71%_36%)] dark:text-[hsl(142_71%_55%)]",
  Inativo: "bg-muted text-muted-foreground",
  Perdido: "bg-destructive/10 text-destructive",
};

export function ClienteDetail({ clienteId }: { clienteId: string }) {
  const { setSelectedClienteId } = useSoW();
  const { data: cliente, isLoading, error } = useSoWCliente(clienteId);

  const deleteCliente = useDeleteCliente();
  const instInterna = useInstituicaoInterna(clienteId);
  const gerarAlertas = useGerarAlertas();
  const gerarOportunidades = useGerarOportunidades();
  const gerarScore = useGerarScore();
  const gerarBriefing = useGerarBriefing();
  const [briefing, setBriefing] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [instEqiId, setInstEqiId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40 rounded-md" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedClienteId(null)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Não foi possível carregar o cliente.
        </div>
      </div>
    );
  }

  const stats: Array<{ label: string; value: string; accent?: string }> = [
    { label: "Patrimônio Total", value: formatBRLCompacto(cliente.patrimonioTotal) },
    {
      label: "Na EQI",
      value: formatBRLCompacto(cliente.patrimonioInterno),
      accent: "text-[hsl(142_71%_36%)] dark:text-[hsl(142_71%_55%)]",
    },
    { label: "Externo", value: formatBRLCompacto(cliente.patrimonioExterno) },
  ];

  const handleGerar = <TData,>(
    mutation: UseMutationResult<TData, Error, string, unknown>,
    label: string
  ) => {
    mutation.mutate(clienteId, {
      onSuccess: () => toast.success(`${label} com sucesso!`),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : `Erro ao ${label.toLowerCase()}.`),
    });
  };

  const handleBriefing = async () => {
    try {
      const res = await gerarBriefing.mutateAsync(clienteId);
      setBriefing(res.texto);
      toast.success("Briefing gerado com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar briefing.");
    }
  };

  // Resolve (criando se preciso) a instituição da casa e abre o form de ativo já
  // fixado nela — o usuário não precisa saber que "na EQI" depende da instituição.
  const handleAddEqi = async () => {
    try {
      setInstEqiId(await instInterna.garantir());
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Erro ao preparar a instituição ${instInterna.nome}.`
      );
    }
  };

  const handleDelete = () => {
    deleteCliente.mutate(clienteId, {
      onSuccess: () => {
        toast.success("Cliente excluído.");
        setConfirmDelete(false);
        setSelectedClienteId(null); // senão a view fica presa num cliente que não existe mais
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Erro ao excluir cliente."),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setSelectedClienteId(null)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <h2 className="text-xl font-bold text-foreground">{cliente.nome}</h2>
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[cliente.status] ?? "bg-muted text-muted-foreground"}`}
        >
          {cliente.status}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={handleAddEqi} disabled={instInterna.isPending}>
            {instInterna.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Building2 className="mr-2 h-4 w-4" />
            )}
            Adicionar patrimônio na {instInterna.nome}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Editar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => setConfirmDelete(true)}
            title="Excluir cliente"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {s.label}
              </p>
              <p className={`text-lg font-bold tabular-nums ${s.accent ?? "text-foreground"}`}>
                {s.value}
              </p>
            </div>
          ))}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Share</p>
            <div className="mt-1.5">
              <ShareBar value={cliente.sharePct} meta={cliente.metaSharePct} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="instituicoes" className="w-full">
        <TabsList>
          <TabsTrigger value="instituicoes">Instituições</TabsTrigger>
          <TabsTrigger value="ativos">Ativos</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="ia">IA</TabsTrigger>
        </TabsList>

        <TabsContent value="instituicoes" className="mt-4">
          <InstituicoesPanel clienteId={clienteId} />
        </TabsContent>

        <TabsContent value="ativos" className="mt-4">
          <AtivosTable clienteId={clienteId} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <ClienteTimeline clienteId={clienteId} />
        </TabsContent>

        <TabsContent value="ia" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={gerarAlertas.isPending}
              onClick={() => handleGerar(gerarAlertas, "Alertas gerados")}
            >
              {gerarAlertas.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Bell className="mr-2 h-4 w-4" />
              )}
              Gerar alertas
            </Button>
            <Button
              variant="outline"
              disabled={gerarOportunidades.isPending}
              onClick={() => handleGerar(gerarOportunidades, "Oportunidades geradas")}
            >
              {gerarOportunidades.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Target className="mr-2 h-4 w-4" />
              )}
              Gerar oportunidades
            </Button>
            <Button
              variant="outline"
              disabled={gerarScore.isPending}
              onClick={() => handleGerar(gerarScore, "Score gerado")}
            >
              {gerarScore.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Gauge className="mr-2 h-4 w-4" />
              )}
              Gerar score
            </Button>
            <Button disabled={gerarBriefing.isPending} onClick={handleBriefing}>
              {gerarBriefing.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Gerar briefing
            </Button>
          </div>

          {briefing && (
            <Card className="border-border/50 shadow-sm">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  Briefing gerado por IA
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{briefing}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <EditClienteDialog cliente={cliente} open={showEdit} onOpenChange={setShowEdit} />

      {instEqiId && (
        <AtivoFormDialog
          clienteId={clienteId}
          instituicaoId={instEqiId}
          open
          onOpenChange={(o) => !o && setInstEqiId(null)}
        />
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{cliente.nome}"? As instituições, ativos, timeline,
              oportunidades e alertas deste cliente serão excluídos junto. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteCliente.isPending}
            >
              {deleteCliente.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
