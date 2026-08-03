import { Fragment, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
import { useDeleteAtivo } from "@/hooks/sow/useSoW";
import { useCarteira } from "@/hooks/sow/useCarteira";
import { LABEL_NAO_MAPEADO, pctDe, type CarteiraAtivo } from "@/lib/sow/carteira";
import { ProporcaoBar } from "@/components/sow/shared/ProporcaoBar";
import { NaoMapeadoHint } from "@/components/sow/shared/NaoMapeadoHint";
import { formatBRLExato, formatPct } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { SoWAtivo, SoWAtivoStatus } from "@/types/sow";
import { format, parseISO } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Edit2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AtivoFormDialog } from "./AtivoFormDialog";

const STATUS_TONE: Record<SoWAtivoStatus, string> = {
  Ativo: "bg-[hsl(142_71%_42%/0.12)] text-[hsl(142_71%_36%)] dark:text-[hsl(142_71%_55%)]",
  Resgatado: "bg-muted text-muted-foreground",
  Vencido: "bg-destructive/10 text-destructive",
  "Em Movimentação": "bg-[hsl(38_92%_50%/0.12)] text-[hsl(38_92%_40%)]",
};

const COLUNAS = 8;

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

type SortKey = "valor" | "pct" | "vencimento" | "nome";
type Dir = "asc" | "desc";
type Agrupamento = "nenhum" | "classe" | "instituicao";

function ordenar(lista: CarteiraAtivo[], key: SortKey, dir: Dir): CarteiraAtivo[] {
  const sinal = dir === "asc" ? 1 : -1;
  return [...lista].sort((a, b) => {
    switch (key) {
      case "nome":
        return sinal * a.nome.localeCompare(b.nome, "pt-BR");
      case "vencimento": {
        // Sem vencimento vai sempre para o fim, independente da direção: uma
        // ação não "vence depois" de um CDB, ela simplesmente não tem data.
        if (!a.vencimento && !b.vencimento) return 0;
        if (!a.vencimento) return 1;
        if (!b.vencimento) return -1;
        return sinal * a.vencimento.localeCompare(b.vencimento);
      }
      // `valor` e `pct` ordenam igual — pct é valor dividido por uma constante.
      default:
        return sinal * ((a.valorAplicado ?? 0) - (b.valorAplicado ?? 0));
    }
  });
}

function SortHead({
  label,
  k,
  sort,
  onSort,
  right,
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: Dir };
  onSort: (k: SortKey) => void;
  right?: boolean;
}) {
  const ativo = sort.key === k;
  return (
    <TableHead className={right ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
          ativo && "font-semibold text-foreground"
        )}
      >
        {label}
        {ativo &&
          (sort.dir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          ))}
      </button>
    </TableHead>
  );
}

export function AtivosTable({
  clienteId,
  instituicaoId,
}: {
  clienteId: string;
  instituicaoId?: string;
}) {
  const { carteira, isLoading } = useCarteira(clienteId);
  const deleteAtivo = useDeleteAtivo();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SoWAtivo | undefined>(undefined);
  const [toDelete, setToDelete] = useState<SoWAtivo | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);
  // Desc por valor, e não por vencimento como vinha do backend: o pedido é
  // "quanto tem em cada ativo", então a maior posição tem de estar na 1ª linha.
  const [sort, setSort] = useState<{ key: SortKey; dir: Dir }>({ key: "valor", dir: "desc" });
  const [agrupar, setAgrupar] = useState<Agrupamento>("nenhum");
  const [gruposFechados, setGruposFechados] = useState<Set<string>>(new Set());

  // Aninhada dentro do InstituicoesPanel, a coluna de instituição é ruído.
  const mostrarInstituicao = !instituicaoId;

  const linhas = useMemo(() => {
    const base = instituicaoId
      ? carteira.ativos.filter((a) => a.instituicaoId === instituicaoId)
      : carteira.ativos;
    return ordenar(base, sort.key, sort.dir);
  }, [carteira.ativos, instituicaoId, sort]);

  // Escopo: dentro de uma instituição, os totais são os DELA — mas o `%` de cada
  // linha continua sendo % da carteira do cliente (ver CarteiraAtivo.pct).
  const escopo = instituicaoId
    ? carteira.instituicoes.find((i) => i.id === instituicaoId)
    : undefined;
  const somaLinhas = linhas.reduce((acc, a) => acc + (a.valorAplicado ?? 0), 0);
  const naoMapeado = escopo ? escopo.naoMapeado : carteira.naoMapeadoTotal;
  const declarado = escopo ? escopo.valorInformado ?? 0 : 0;
  const patrimonioEscopo = escopo ? escopo.patrimonio : carteira.total;

  const grupos = useMemo(() => {
    if (agrupar === "nenhum") return null;
    const chave = (a: CarteiraAtivo) => (agrupar === "classe" ? a.classe : a.instituicaoNome);
    const mapa = new Map<string, CarteiraAtivo[]>();
    for (const a of linhas) {
      const k = chave(a);
      if (!mapa.has(k)) mapa.set(k, []);
      mapa.get(k)!.push(a);
    }
    return [...mapa.entries()]
      .map(([rotulo, itens]) => ({
        rotulo,
        itens,
        soma: itens.reduce((acc, a) => acc + (a.valorAplicado ?? 0), 0),
      }))
      .sort((a, b) => b.soma - a.soma);
  }, [linhas, agrupar]);

  const toggleSort = (k: SortKey) =>
    setSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "desc" }));

  const toggleGrupo = (rotulo: string) =>
    setGruposFechados((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(rotulo)) proximo.delete(rotulo);
      else proximo.add(rotulo);
      return proximo;
    });

  const openNew = () => {
    setEditing(undefined);
    setShowForm(true);
  };
  const openEdit = (a: SoWAtivo) => {
    setEditing(a);
    setShowForm(true);
  };

  const linhaAtivo = (a: CarteiraAtivo) => {
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
                  {aberto ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              )}
            </div>
            {/* Sem isto, a aba Ativos não dizia em que banco estava cada papel. */}
            {mostrarInstituicao && (
              <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <span
                  aria-hidden
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    a.instituicaoInterna ? "bg-[hsl(var(--chart-2))]" : "bg-muted-foreground/40"
                  )}
                />
                {a.instituicaoNome}
                {a.instituicaoInterna && (
                  <span className="font-medium text-[hsl(142_71%_36%)] dark:text-[hsl(142_71%_55%)]">
                    · EQI
                  </span>
                )}
              </span>
            )}
          </TableCell>

          <TableCell className="text-right tabular-nums">
            {formatBRLExato(a.valorAplicado)}
          </TableCell>

          <TableCell className="text-right">
            <span className="tabular-nums text-sm">{formatPct(a.pct, 1)}</span>
            <ProporcaoBar
              pct={a.pct}
              tone={a.instituicaoInterna ? "interna" : "externa"}
              className="ml-auto mt-1 w-16"
            />
          </TableCell>

          <TableCell className="text-sm text-muted-foreground">
            {a.rentabilidade || "—"}
            <span className="block text-[11px] text-muted-foreground/70">{a.liquidez || "—"}</span>
          </TableCell>

          <TableCell className="text-sm">
            {fmtDate(a.vencimento)}
            {legenda && (
              <span
                className={cn(
                  "block text-[11px]",
                  a.diasAteVencimento != null && a.diasAteVencimento < 0
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {legenda}
              </span>
            )}
          </TableCell>

          <TableCell>
            {/* statusEfetivo, não status: a coluna gravada nunca é recalculada
                (não há scheduler), então um papel vencido continuaria verde
                "Ativo" para sempre. */}
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
                STATUS_TONE[a.statusEfetivo] ?? "bg-muted text-muted-foreground"
              )}
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
            <TableCell colSpan={COLUNAS} className="bg-muted/30 py-3">
              <div className="flex items-start gap-2 text-sm">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="space-y-1">
                  <p className="whitespace-pre-wrap text-muted-foreground">{a.analiseIA}</p>
                  <p className="text-[11px] text-muted-foreground/70">
                    Análise gerada por IA em {fmtDate(a.analiseIAEm)} — revise antes de usar.
                  </p>
                </div>
              </div>
            </TableCell>
          </TableRow>
        )}
      </Fragment>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Ativos</h3>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            size="sm"
            value={agrupar}
            onValueChange={(v) => v && setAgrupar(v as Agrupamento)}
            className="hidden sm:flex"
          >
            <ToggleGroupItem value="nenhum" className="text-xs">
              Lista
            </ToggleGroupItem>
            <ToggleGroupItem value="classe" className="text-xs">
              Por classe
            </ToggleGroupItem>
            {mostrarInstituicao && (
              <ToggleGroupItem value="instituicao" className="text-xs">
                Por instituição
              </ToggleGroupItem>
            )}
          </ToggleGroup>
          <Button size="sm" onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Novo ativo
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Tipo</TableHead>
              <SortHead label="Nome" k="nome" sort={sort} onSort={toggleSort} />
              <SortHead label="Valor aplicado" k="valor" sort={sort} onSort={toggleSort} right />
              <SortHead label="% da carteira" k="pct" sort={sort} onSort={toggleSort} right />
              <TableHead>Rentab. / Liquidez</TableHead>
              <SortHead label="Vencimento" k="vencimento" sort={sort} onSort={toggleSort} />
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={COLUNAS}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : linhas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUNAS}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Nenhum ativo cadastrado.
                </TableCell>
              </TableRow>
            ) : grupos ? (
              grupos.map((g) => {
                const fechado = gruposFechados.has(g.rotulo);
                return (
                  <Fragment key={g.rotulo}>
                    <TableRow
                      className="cursor-pointer bg-muted/30 hover:bg-muted/50"
                      onClick={() => toggleGrupo(g.rotulo)}
                    >
                      <TableCell colSpan={2} className="font-semibold">
                        <ChevronRight
                          className={cn(
                            "mr-1 inline h-3.5 w-3.5 transition-transform",
                            !fechado && "rotate-90"
                          )}
                        />
                        {g.rotulo}
                        <span className="ml-1 font-normal text-muted-foreground">
                          · {g.itens.length}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatBRLExato(g.soma)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatPct(pctDe(g.soma, carteira.total), 1)}
                      </TableCell>
                      <TableCell colSpan={4} />
                    </TableRow>
                    {!fechado && g.itens.map(linhaAtivo)}
                  </Fragment>
                );
              })
            ) : (
              linhas.map(linhaAtivo)
            )}
          </TableBody>

          {/*
            TRÊS linhas, nunca uma. "Total" sozinho seria mentira em toda carteira
            com saldo declarado maior que a soma dos ativos: a soma das linhas
            NÃO é o patrimônio, e é justamente por isso que a coluna de % não
            fecha 100%.
          */}
          {!isLoading && linhas.length > 0 && (
            <TableFooter>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={2}>
                  Total em ativos{" "}
                  <span className="font-normal text-muted-foreground">
                    ({linhas.length} {linhas.length === 1 ? "posição" : "posições"})
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatBRLExato(somaLinhas)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPct(pctDe(somaLinhas, carteira.total), 1)}
                </TableCell>
                <TableCell colSpan={4} />
              </TableRow>

              {naoMapeado > 0 && (
                <TableRow className="text-muted-foreground hover:bg-transparent">
                  <TableCell colSpan={2} className="font-normal">
                    <span className="inline-flex items-center gap-1">
                      {LABEL_NAO_MAPEADO}
                      {escopo ? (
                        <NaoMapeadoHint
                          declarado={declarado}
                          mapeado={escopo.mapeado}
                          naoMapeado={naoMapeado}
                        />
                      ) : (
                        <NaoMapeadoHint
                          declarado={carteira.mapeadoTotal + carteira.naoMapeadoTotal}
                          mapeado={carteira.mapeadoTotal}
                          naoMapeado={carteira.naoMapeadoTotal}
                        />
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRLExato(naoMapeado)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPct(pctDe(naoMapeado, carteira.total), 1)}
                  </TableCell>
                  <TableCell colSpan={4} />
                </TableRow>
              )}

              <TableRow className="font-semibold text-foreground hover:bg-transparent">
                <TableCell colSpan={2}>
                  {escopo ? `Patrimônio em ${escopo.nome}` : "Patrimônio do cliente"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatBRLExato(patrimonioEscopo)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {escopo ? formatPct(escopo.pct, 1) : "100%"}
                </TableCell>
                <TableCell colSpan={4} />
              </TableRow>
            </TableFooter>
          )}
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
