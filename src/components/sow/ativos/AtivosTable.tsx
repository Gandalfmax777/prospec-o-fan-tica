import { Fragment, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useSoWAtivosCliente, useDeleteAtivo } from "@/hooks/sow/useSoW";
import { formatBRLExato } from "@/lib/money";
import type { SoWAtivo, SoWAtivoStatus } from "@/types/sow";
import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronUp, Edit2, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AtivoFormDialog } from "./AtivoFormDialog";

const STATUS_TONE: Record<SoWAtivoStatus, string> = {
  Ativo: "bg-[hsl(142_71%_42%/0.12)] text-[hsl(142_71%_36%)] dark:text-[hsl(142_71%_55%)]",
  Resgatado: "bg-muted text-muted-foreground",
  Vencido: "bg-destructive/10 text-destructive",
  "Em Movimentação": "bg-[hsl(38_92%_50%/0.12)] text-[hsl(38_92%_40%)]",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "dd/MM/yyyy");
  } catch {
    return "—";
  }
}

/** Legenda sob a data. `diasAteVencimento` é assinado: negativo = já venceu. */
function legendaVencimento(dias: number | null): string | null {
  if (dias == null) return null;
  if (dias < 0) return `venceu há ${-dias} ${-dias === 1 ? "dia" : "dias"}`;
  if (dias === 0) return "vence hoje";
  if (dias <= 90) return `em ${dias} ${dias === 1 ? "dia" : "dias"}`;
  return null;
}

export function AtivosTable({
  clienteId,
  instituicaoId,
}: {
  clienteId: string;
  instituicaoId?: string;
}) {
  const { data, isLoading } = useSoWAtivosCliente(clienteId);
  const deleteAtivo = useDeleteAtivo();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SoWAtivo | undefined>(undefined);
  const [toDelete, setToDelete] = useState<SoWAtivo | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  const ativos = useMemo(() => {
    const list = data ?? [];
    return instituicaoId ? list.filter((a) => a.instituicaoId === instituicaoId) : list;
  }, [data, instituicaoId]);

  const openNew = () => {
    setEditing(undefined);
    setShowForm(true);
  };
  const openEdit = (a: SoWAtivo) => {
    setEditing(a);
    setShowForm(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Ativos</h3>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo ativo
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Tipo</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Valor aplicado</TableHead>
              <TableHead>Rentabilidade</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Liquidez</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : ativos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum ativo cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              ativos.map((a) => {
                const legenda = legendaVencimento(a.diasAteVencimento);
                const aberto = expandido === a.id;
                return (
                  <Fragment key={a.id}>
                    <TableRow>
                      <TableCell>
                        <span className="metric-badge bg-muted text-muted-foreground">{a.tipo}</span>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1.5">
                          {a.nome}
                          {a.analiseIA && (
                            <button
                              type="button"
                              onClick={() => setExpandido(aberto ? null : a.id)}
                              className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10"
                              title="Análise da IA para este ativo"
                            >
                              <Sparkles className="h-3 w-3" />
                              {aberto ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRLExato(a.valorAplicado)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.rentabilidade || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {fmtDate(a.vencimento)}
                        {legenda && (
                          <span
                            className={`block text-[11px] ${
                              a.diasAteVencimento != null && a.diasAteVencimento < 0
                                ? "text-destructive"
                                : "text-muted-foreground"
                            }`}
                          >
                            {legenda}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.liquidez || "—"}
                      </TableCell>
                      <TableCell>
                        {/* statusEfetivo, não status: a coluna gravada nunca é
                            recalculada (não há scheduler), então um papel
                            vencido continuaria verde "Ativo" para sempre. */}
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[a.statusEfetivo] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {a.statusEfetivo}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(a)}
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setToDelete(a)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {aberto && a.analiseIA && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={8} className="bg-muted/30 py-3">
                          <div className="flex items-start gap-2 text-sm">
                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <div className="space-y-1">
                              <p className="whitespace-pre-wrap text-muted-foreground">
                                {a.analiseIA}
                              </p>
                              <p className="text-[11px] text-muted-foreground/70">
                                Análise gerada por IA em {fmtDate(a.analiseIAEm)} — revise antes de
                                usar.
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {showForm && (
        <AtivoFormDialog
          clienteId={clienteId}
          instituicaoId={instituicaoId}
          ativo={editing}
          open={showForm}
          onOpenChange={setShowForm}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ativo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{toDelete?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!toDelete) return;
                deleteAtivo.mutate(toDelete.id, {
                  onSuccess: () => {
                    toast.success("Ativo excluído.");
                    setToDelete(null);
                  },
                  onError: (err) =>
                    toast.error(err instanceof Error ? err.message : "Erro ao excluir ativo."),
                });
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
