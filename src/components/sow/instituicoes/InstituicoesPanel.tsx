import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useSoWInstituicoes, useDeleteInstituicao } from "@/hooks/sow/useSoW";
import { formatBRLExato } from "@/lib/money";
import type { SoWInstituicao } from "@/types/sow";
import { AtivosTable } from "@/components/sow/ativos/AtivosTable";
import { NovaInstituicaoDialog } from "./NovaInstituicaoDialog";
import { Building2, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function InstituicoesPanel({ clienteId }: { clienteId: string }) {
  const { data, isLoading } = useSoWInstituicoes(clienteId);
  const deleteInstituicao = useDeleteInstituicao();

  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = useState<SoWInstituicao | null>(null);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const instituicoes = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Instituições</h3>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova instituição
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : instituicoes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhuma instituição cadastrada para este cliente.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {instituicoes.map((inst) => {
            const isOpen = expanded.has(inst.id);
            return (
              <Card key={inst.id} className="border-border/50 shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                  <button
                    className="flex min-w-0 flex-1 items-start gap-2 text-left"
                    onClick={() => toggle(inst.id)}
                  >
                    {isOpen ? (
                      <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{inst.nome}</span>
                        {inst.interna && (
                          <Badge variant="secondary" className="text-[10px]">
                            Própria instituição
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        <span>
                          Valor informado:{" "}
                          <span className="text-foreground tabular-nums">
                            {inst.valorInformado != null
                              ? formatBRLExato(inst.valorInformado)
                              : "—"}
                          </span>
                        </span>
                        {inst.responsavel && <span>Responsável: {inst.responsavel}</span>}
                      </div>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-destructive"
                    onClick={() => setToDelete(inst)}
                    title="Excluir instituição"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                {isOpen && (
                  <CardContent className="pt-0">
                    <AtivosTable clienteId={clienteId} instituicaoId={inst.id} />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <NovaInstituicaoDialog clienteId={clienteId} open={showNew} onOpenChange={setShowNew} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir instituição</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{toDelete?.nome}"? Os ativos vinculados também
              podem ser removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!toDelete) return;
                deleteInstituicao.mutate(toDelete.id, {
                  onSuccess: () => {
                    toast.success("Instituição excluída.");
                    setToDelete(null);
                  },
                  onError: (err) =>
                    toast.error(
                      err instanceof Error ? err.message : "Erro ao excluir instituição."
                    ),
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
