import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCRM } from "@/context/CRMContext";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KPICard } from "./KPICard";
import { api } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import type { SugestaoHistoricoItem, SugestoesHistoricoResponse } from "@/types/api";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Check,
  ChevronsUpDown,
  Copy,
  Download,
  Loader2,
  Quote,
  Sparkles,
  Target,
  Users,
  Wallet,
} from "lucide-react";

const PAGE_SIZE = 20;

/**
 * Teto de itens renderizados no seletor de lead.
 *
 * A carteira passa de mil leads e o cmdk não virtualiza: sem o corte, abrir o
 * popover monta milhares de nós de uma vez. Como a lista é ordenada por
 * relevância da busca, quem procura alguém específico digita e acha.
 */
const LIMITE_SELETOR = 50;

const dataHora = (iso: string) =>
  format(new Date(iso), "dd/MM/yy 'às' HH:mm", { locale: ptBR });

/** Busca insensível a acento — "jose" tem de achar "José". */
const chaveBusca = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

interface SugestoesIATabProps {
  /** LEADER/ADMIN ganham o seletor de escopo; SELLER nem vê a opção. */
  isLeader?: boolean;
}

/**
 * Histórico das sugestões de follow-up geradas por IA.
 *
 * Os KPIs são do conjunto FILTRADO, não da página — quem filtra por "não
 * copiadas" quer ver o tamanho daquele problema, não o total geral.
 */
export const SugestoesIATab = ({ isLeader = false }: SugestoesIATabProps) => {
  const [dados, setDados] = useState<SugestoesHistoricoResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [expandida, setExpandida] = useState<string | null>(null);

  const [escopo, setEscopo] = useState("padrao");
  const [copiadas, setCopiadas] = useState("todas");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [page, setPage] = useState(1);

  // O seletor de lead sai do contexto do CRM, que já carrega a carteira toda —
  // não vale um endpoint de busca só para isto.
  const { leads } = useCRM();
  const [leadSelecionado, setLeadSelecionado] = useState<{ id: string; nome: string } | null>(null);
  const [buscaLead, setBuscaLead] = useState("");
  const [seletorAberto, setSeletorAberto] = useState(false);

  const [assessorSelecionado, setAssessorSelecionado] = useState<{ id: string; nome: string } | null>(null);
  const [exportando, setExportando] = useState(false);

  const leadsFiltrados = useMemo(() => {
    const termo = chaveBusca(buscaLead.trim());
    const base = termo
      ? leads.filter(
          (l) =>
            chaveBusca(l.nome).includes(termo) ||
            chaveBusca(l.cidade ?? "").includes(termo) ||
            chaveBusca(l.codigo ?? "").includes(termo)
        )
      : leads;
    return { itens: base.slice(0, LIMITE_SELETOR), total: base.length };
  }, [leads, buscaLead]);

  // Um objeto só, para a listagem e a exportação nunca usarem recortes
  // diferentes — um CSV que não bate com a tela é pior que nenhum CSV.
  const filtros = useMemo(
    () => ({
      escopo: escopo === "padrao" ? undefined : escopo,
      copiadas: copiadas === "todas" ? undefined : copiadas,
      leadId: leadSelecionado?.id,
      assessorId: assessorSelecionado?.id,
      de: de || undefined,
      ate: ate || undefined,
    }),
    [escopo, copiadas, leadSelecionado, assessorSelecionado, de, ate]
  );

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const r = await api.listarSugestoes({ ...filtros, page, pageSize: PAGE_SIZE });
      setDados(r);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível carregar o histórico.");
    } finally {
      setCarregando(false);
    }
  }, [filtros, page]);

  const exportar = async () => {
    setExportando(true);
    try {
      const { blob, nomeArquivo, total } = await api.exportarSugestoesCsv(filtros);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({
        title: "CSV exportado",
        description:
          total !== null
            ? `${total} sugest${total === 1 ? "ão" : "ões"} no arquivo.`
            : undefined,
      });
    } catch (err) {
      toast({
        title: "Não foi possível exportar",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setExportando(false);
    }
  };

  useEffect(() => {
    buscar();
  }, [buscar]);

  // Trocar filtro tem de voltar para a primeira página, senão a tela abre vazia
  // num offset que não existe mais no conjunto novo.
  const aoFiltrar = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const copiar = async (item: SugestaoHistoricoItem) => {
    try {
      await navigator.clipboard.writeText(item.mensagem);
      toast({ title: "Mensagem copiada!" });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  const resumo = dados?.resumo;
  const totalPaginas = dados ? Math.max(1, Math.ceil(dados.total / dados.pageSize)) : 1;
  const mostrarAssessor = dados?.escopo !== "me";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          title="Sugestões geradas"
          value={resumo?.geradas ?? "—"}
          icon={Sparkles}
          variant="primary"
        />
        <KPICard
          title="Copiadas"
          value={resumo?.copiadas ?? "—"}
          icon={Copy}
          variant="success"
        />
        <KPICard
          title="Taxa de aproveitamento"
          value={resumo ? `${resumo.taxaCopia}%` : "—"}
          icon={Target}
          variant="default"
        />
        <KPICard
          title="Com ressalva"
          value={resumo?.comRessalva ?? "—"}
          icon={AlertTriangle}
          variant={resumo && resumo.comRessalva > 0 ? "warning" : "default"}
        />
      </div>

      {copiadas !== "todas" && (
        <p className="-mt-2 text-xs text-muted-foreground">
          Os indicadores acima cobrem todo o recorte de escopo e período — o filtro de
          aproveitamento vale só para a lista, senão a taxa daria sempre 0% ou 100%.
        </p>
      )}

      {/* Continua visível com um assessor filtrado: é por ele que se troca de
          assessor ou se volta para a visão geral. */}
      {resumo && (resumo.porAssessor.length > 1 || assessorSelecionado) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Por assessor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessor</TableHead>
                    <TableHead className="text-center">Geradas</TableHead>
                    <TableHead className="text-center">Copiadas</TableHead>
                    <TableHead className="w-[40%]">Aproveitamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumo.porAssessor.map((a) => {
                    const ativo = assessorSelecionado?.id === a.assessorId;
                    return (
                      <TableRow
                        key={a.assessorId}
                        className={cn("cursor-pointer", ativo && "bg-primary/5")}
                        // Clicar filtra por esse assessor; clicar de novo limpa.
                        onClick={() =>
                          aoFiltrar(() =>
                            setAssessorSelecionado(
                              ativo
                                ? null
                                : { id: a.assessorId, nome: a.assessorNome ?? "Assessor" }
                            )
                          )
                        }
                      >
                        <TableCell className="font-medium">
                          {a.assessorNome ?? "—"}
                          {ativo && (
                            <Badge variant="secondary" className="ml-2 text-[11px]">
                              filtrando
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">{a.geradas}</TableCell>
                        <TableCell className="text-center tabular-nums">{a.copiadas}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${a.taxaCopia}%` }}
                              />
                            </div>
                            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                              {a.taxaCopia}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Histórico de sugestões
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={exportar}
            disabled={exportando || !dados || dados.total === 0}
          >
            {exportando ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div className="space-y-1.5">
              <Label className="text-xs">Lead</Label>
              <Popover open={seletorAberto} onOpenChange={setSeletorAberto}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={seletorAberto}
                    className="h-9 w-full justify-between font-normal"
                  >
                    <span
                      className={cn("truncate", !leadSelecionado && "text-muted-foreground")}
                    >
                      {leadSelecionado ? leadSelecionado.nome : "Todos os leads"}
                    </span>
                    <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
                  {/* shouldFilter={false}: a filtragem é nossa, para poder
                      cortar em LIMITE_SELETOR antes de renderizar. */}
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Nome, cidade ou código..."
                      value={buscaLead}
                      onValueChange={setBuscaLead}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhum lead encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="__todos"
                          onSelect={() => {
                            aoFiltrar(() => setLeadSelecionado(null));
                            setSeletorAberto(false);
                            setBuscaLead("");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3.5 w-3.5",
                              leadSelecionado ? "opacity-0" : "opacity-100"
                            )}
                          />
                          Todos os leads
                        </CommandItem>
                        {leadsFiltrados.itens.map((l) => (
                          <CommandItem
                            key={l.id}
                            value={l.id}
                            onSelect={() => {
                              aoFiltrar(() => setLeadSelecionado({ id: l.id, nome: l.nome }));
                              setSeletorAberto(false);
                              setBuscaLead("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3.5 w-3.5 shrink-0",
                                leadSelecionado?.id === l.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="truncate">{l.nome}</span>
                            {l.cidade && (
                              <span className="ml-auto shrink-0 pl-2 text-xs text-muted-foreground">
                                {l.cidade}
                              </span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      {leadsFiltrados.total > LIMITE_SELETOR && (
                        <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                          Mostrando {LIMITE_SELETOR} de {leadsFiltrados.total} — refine a busca.
                        </p>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {isLeader && (
              <div className="space-y-1.5">
                <Label className="text-xs">Escopo</Label>
                <Select value={escopo} onValueChange={(v) => aoFiltrar(() => setEscopo(v))}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="padrao">Padrão do meu papel</SelectItem>
                    <SelectItem value="me">Só as minhas</SelectItem>
                    <SelectItem value="team">Minha equipe</SelectItem>
                    <SelectItem value="org">Organização</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Aproveitamento</Label>
              <Select value={copiadas} onValueChange={(v) => aoFiltrar(() => setCopiadas(v))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="sim">Só as copiadas</SelectItem>
                  <SelectItem value="nao">Só as não copiadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">De</Label>
              <Input
                type="date"
                value={de}
                onChange={(e) => aoFiltrar(() => setDe(e.target.value))}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Até</Label>
              <Input
                type="date"
                value={ate}
                onChange={(e) => aoFiltrar(() => setAte(e.target.value))}
                className="h-9"
              />
            </div>
          </div>

          {erro && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
              <p className="text-destructive">{erro}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={buscar}>
                Tentar de novo
              </Button>
            </div>
          )}

          {carregando && !dados ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !erro && dados && dados.itens.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Sparkles className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">
                {copiadas === "sim"
                  ? "Nenhuma sugestão foi copiada neste recorte."
                  : copiadas === "nao"
                    ? "Todas as sugestões do recorte foram copiadas."
                    : leadSelecionado
                      ? `Nenhuma sugestão gerada para ${leadSelecionado.nome}.`
                      : "Nenhuma sugestão no período."}
              </p>
              {copiadas === "todas" && !leadSelecionado && (
                <p className="text-xs">
                  Elas aparecem aqui assim que você gerar a primeira em Pendências ou na lista de
                  contatos.
                </p>
              )}
            </div>
          ) : !erro && dados ? (
            <>
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" />
                      <TableHead>Lead</TableHead>
                      {mostrarAssessor && <TableHead>Assessor</TableHead>}
                      <TableHead>Objetivo</TableHead>
                      <TableHead className="text-center">Âncoras</TableHead>
                      <TableHead>Gerada</TableHead>
                      <TableHead>Copiada</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.itens.map((s) => {
                      const aberta = expandida === s.id;
                      return (
                        // Fragment com key: o fragmento curto <> não aceita
                        // key, e sem ela cada linha vira um filho anônimo.
                        <Fragment key={s.id}>
                          <TableRow
                            className="cursor-pointer"
                            onClick={() => setExpandida(aberta ? null : s.id)}
                          >
                            <TableCell className="pr-0">
                              {aberta ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {s.leadNome ?? "—"}
                              {s.leadCidade && (
                                <span className="block text-xs text-muted-foreground">
                                  {s.leadCidade}
                                </span>
                              )}
                            </TableCell>
                            {mostrarAssessor && (
                              <TableCell className="text-sm text-muted-foreground">
                                {s.assessorNome ?? "—"}
                              </TableCell>
                            )}
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-1">
                                <Badge variant="secondary" className="text-[11px]">
                                  {s.objetivoTipo}
                                </Badge>
                                {s.comCarteira && (
                                  <Badge variant="outline" className="gap-1 text-[11px]">
                                    <Wallet className="h-3 w-3" />
                                    carteira
                                  </Badge>
                                )}
                                {!s.qualidadeAprovado && (
                                  <Badge variant="destructive" className="text-[11px]">
                                    ressalva
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center tabular-nums">
                              {s.ancorasConfirmadas}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                              {dataHora(s.criadaEm)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {s.copiadaEm ? (
                                <span className="text-[hsl(142_71%_36%)] dark:text-[hsl(142_71%_55%)]">
                                  {dataHora(s.copiadaEm)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>

                          {aberta && (
                            <TableRow className="hover:bg-transparent">
                              <TableCell colSpan={mostrarAssessor ? 7 : 6} className="bg-muted/30">
                                <div className="space-y-4 p-2">
                                  <section className="space-y-1">
                                    <h4 className="flex items-center gap-1.5 text-sm font-semibold">
                                      <Target className="h-3.5 w-3.5 text-primary" />
                                      Objetivo
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {s.objetivoPorQueAgora}
                                    </p>
                                  </section>

                                  {s.contextoUtilizado.length > 0 && (
                                    <section className="space-y-1.5">
                                      <h4 className="flex items-center gap-1.5 text-sm font-semibold">
                                        <Quote className="h-3.5 w-3.5 text-primary" />
                                        Contexto utilizado
                                      </h4>
                                      <ul className="space-y-1.5">
                                        {s.contextoUtilizado.map((c, i) => (
                                          <li key={`${c.ancora}-${i}`} className="text-sm">
                                            {c.afirmacao}
                                            <span className="block border-l-2 border-border pl-2 text-xs italic text-muted-foreground">
                                              "{c.ancora}"
                                              <span className="not-italic">
                                                {" "}
                                                — {c.fonte}
                                                {c.data ? ` · ${c.data}` : ""}
                                              </span>
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </section>
                                  )}

                                  <section className="space-y-1.5">
                                    <h4 className="text-sm font-semibold">
                                      Mensagem enviada ao cliente
                                    </h4>
                                    <p className="whitespace-pre-line rounded-md border border-border bg-background p-3 text-sm">
                                      {s.mensagem}
                                    </p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copiar(s);
                                      }}
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                      Copiar mensagem
                                    </Button>
                                  </section>

                                  {s.justificativa && (
                                    <section className="space-y-1">
                                      <h4 className="text-sm font-semibold">Por que essa abordagem</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {s.justificativa}
                                      </p>
                                    </section>
                                  )}

                                  {!s.qualidadeAprovado && s.qualidadeFalhas.length > 0 && (
                                    <section className="space-y-1">
                                      <h4 className="text-sm font-semibold text-destructive">
                                        Ressalvas da conferência
                                      </h4>
                                      <ul className="list-disc pl-4 text-xs text-muted-foreground">
                                        {s.qualidadeFalhas.map((f) => (
                                          <li key={f}>{f}</li>
                                        ))}
                                      </ul>
                                    </section>
                                  )}

                                  <p className="text-[11px] text-muted-foreground">
                                    {s.canal} · tom {s.tom}
                                    {s.modeloIA ? ` · ${s.modeloIA}` : ""}
                                  </p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {dados.total} sugest{dados.total === 1 ? "ão" : "ões"} · página {dados.page} de{" "}
                  {totalPaginas}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || carregando}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPaginas || carregando}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
