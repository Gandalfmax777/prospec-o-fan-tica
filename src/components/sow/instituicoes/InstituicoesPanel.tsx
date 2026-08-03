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
import { useDeleteInstituicao } from "@/hooks/sow/useSoW";
import { useCarteira } from "@/hooks/sow/useCarteira";
import { LABEL_NAO_MAPEADO, type CarteiraInstituicao } from "@/lib/sow/carteira";
import { ProporcaoBar } from "@/components/sow/shared/ProporcaoBar";
import { NaoMapeadoHint } from "@/components/sow/shared/NaoMapeadoHint";
import { formatBRLExato, formatPct } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { SoWInstituicao } from "@/types/sow";
import { AtivosTable } from "@/components/sow/ativos/AtivosTable";
import { NovaInstituicaoDialog } from "./NovaInstituicaoDialog";
import { Building2, ChevronDown, ChevronRight, Edit2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Uma seção (Na EQI / Fora da EQI) com subtotal e o card de cada instituição.
 *
 * O card mostra o PATRIMÔNIO REAL (`mapeado + naoMapeado`), não o
 * `valorInformado` que ficava aqui antes: uma instituição com cinco ativos
 * cadastrados e nenhum saldo declarado aparecia como "—" tendo milhões.
 */
function Secao({
  titulo,
  itens,
  subtotal,
  total,
  clienteId,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  titulo: string;
  itens: CarteiraInstituicao[];
  subtotal: number;
  total: number;
  clienteId: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (i: SoWInstituicao) => void;
  onDelete: (i: SoWInstituicao) => void;
}) {
  if (itens.length === 0) return null;
  const interna = itens[0].interna;

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border/50 pb-1.5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {titulo}
          <span className="ml-1.5 font-normal normal-case tracking-normal">
            · {itens.length} {itens.length === 1 ? "instituição" : "instituições"}
          </span>
        </h4>
        <span className="text-sm tabular-nums">
          <span
            className={cn(
              "font-semibold",
              interna && "text-[hsl(142_71%_36%)] dark:text-[hsl(142_71%_55%)]"
            )}
          >
            {formatBRLExato(subtotal)}
          </span>
          <span className="ml-1.5 text-xs text-muted-foreground">
            {formatPct(total > 0 ? (subtotal / total) * 100 : 0, 1)} da carteira
          </span>
        </span>
      </div>

      <div className="space-y-3">
        {itens.map((inst) => {
          const isOpen = expanded.has(inst.id);
          return (
            <Card key={inst.id} className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                {/*
                  O botao de expandir cobre SO a linha do nome. O bloco de
                  métricas fica fora dele porque contém o tooltip do "declarado
                  sem detalhe", que é um <button> — e <button> dentro de <button>
                  é HTML inválido: o React reclama e o clique do tooltip
                  borbulharia para o expandir.
                */}
                <button
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => onToggle(inst.id)}
                  aria-expanded={isOpen}
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{inst.nome}</span>
                    {inst.interna && (
                      <Badge variant="secondary" className="text-[10px]">
                        Da casa · conta como EQI
                      </Badge>
                    )}
                  </span>
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(inst.origem)}
                    title="Editar instituição"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onDelete(inst.origem)}
                    title="Excluir instituição"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-1.5 pb-4 pt-0 pl-12">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {formatBRLExato(inst.patrimonio)}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatPct(inst.pct, 1)} da carteira
                  </span>
                </div>

                <ProporcaoBar
                  pct={inst.pct}
                  tone={inst.interna ? "interna" : "externa"}
                  className="max-w-[240px]"
                />

                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
                  <span>
                    {formatBRLExato(inst.mapeado)} em {inst.ativos.length}{" "}
                    {inst.ativos.length === 1 ? "ativo" : "ativos"}
                  </span>

                  {inst.naoMapeado > 0 && (
                    <span className="inline-flex items-center gap-1">
                      + {formatBRLExato(inst.naoMapeado)} {LABEL_NAO_MAPEADO.toLowerCase()}
                      <NaoMapeadoHint
                        declarado={inst.valorInformado ?? 0}
                        mapeado={inst.mapeado}
                        naoMapeado={inst.naoMapeado}
                      />
                    </span>
                  )}

                  {/* Ninguém avisava: o assessor digita 1 mi, há 2 mi em ativos,
                      e o declarado é silenciosamente descartado pelo max(0, ...)
                      do recalc. */}
                  {inst.declaradoDefasado && (
                    <span className="text-[hsl(38_92%_40%)] dark:text-[hsl(38_92%_60%)]">
                      saldo informado ({formatBRLExato(inst.valorInformado ?? 0)}) é menor que os
                      ativos — o patrimônio usa os ativos
                    </span>
                  )}

                  {inst.origem.responsavel && <span>Responsável: {inst.origem.responsavel}</span>}
                </div>
              </CardContent>

              {isOpen && (
                <CardContent className="pt-0">
                  <AtivosTable clienteId={clienteId} instituicaoId={inst.id} />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export function InstituicoesPanel({ clienteId }: { clienteId: string }) {
  const { carteira, isLoading } = useCarteira(clienteId);
  const deleteInstituicao = useDeleteInstituicao();

  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<SoWInstituicao | null>(null);
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

  const instituicoes = carteira.instituicoes;
  const internas = instituicoes.filter((i) => i.interna);
  const externas = instituicoes.filter((i) => !i.interna);

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
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
            Os ativos ficam dentro de uma instituição. Marque a instituição da casa para que o
            patrimônio dela conte como Patrimônio na EQI.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setShowNew(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar instituição
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <Secao
            titulo="Na EQI"
            itens={internas}
            subtotal={carteira.interno}
            total={carteira.total}
            clienteId={clienteId}
            expanded={expanded}
            onToggle={toggle}
            onEdit={setEditing}
            onDelete={setToDelete}
          />
          <Secao
            titulo="Fora da EQI"
            itens={externas}
            subtotal={carteira.externo}
            total={carteira.total}
            clienteId={clienteId}
            expanded={expanded}
            onToggle={toggle}
            onEdit={setEditing}
            onDelete={setToDelete}
          />
        </div>
      )}

      <NovaInstituicaoDialog clienteId={clienteId} open={showNew} onOpenChange={setShowNew} />

      {editing && (
        <NovaInstituicaoDialog
          clienteId={clienteId}
          instituicao={editing}
          open
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

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
