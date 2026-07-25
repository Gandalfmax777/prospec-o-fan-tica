import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import type { FollowUpSugestao } from "@/types/api";
import type { Lead } from "@/types/crm";
import {
  AlertTriangle,
  Copy,
  Info,
  Loader2,
  Quote,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";

// Espelham as whitelists do backend (lib/cadencia/capabilities/followUpLead.js).
// Divergir aqui não dá erro visível: o valor cairia no default em silêncio, e o
// assessor pediria "E-mail" recebendo uma mensagem de WhatsApp.
const CANAIS = ["WhatsApp", "E-mail", "Ligação"] as const;
const TONS = ["consultivo", "direto", "próximo"] as const;

interface FollowUpIADialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Sugestão consultiva de follow-up. Nada é enviado — a IA lê todo o histórico
 * do lead e devolve o objetivo do contato, o contexto que sustenta a abordagem,
 * a mensagem pronta e a justificativa.
 *
 * A fronteira entre "o que vai para o cliente" e "o que é para o assessor" é
 * explícita na tela de propósito: só a mensagem pode ser enviada, e o resto
 * pode citar dados de carteira que não devem sair daqui.
 */
export function FollowUpIADialog({ lead, open, onOpenChange }: FollowUpIADialogProps) {
  const [canal, setCanal] = useState<string>("WhatsApp");
  const [tom, setTom] = useState<string>("consultivo");
  const [sugestao, setSugestao] = useState<FollowUpSugestao | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [gerando, setGerando] = useState(false);
  const [carregandoSalva, setCarregandoSalva] = useState(false);
  const [aba, setAba] = useState("atual");
  const [historico, setHistorico] = useState<FollowUpSugestao[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [historicoCarregado, setHistoricoCarregado] = useState(false);

  // Ao (re)abrir: limpa o que era do lead anterior e busca a última sugestão
  // salva deste. Reler o que já foi gerado não deve custar outra chamada ao
  // Opus — são ~30s e alguns centavos por geração.
  useEffect(() => {
    if (!open) return;

    setSugestao(null);
    setMensagem("");
    setHistorico([]);
    setHistoricoCarregado(false);
    setAba("atual");
    setCarregandoSalva(true);

    let cancelado = false;
    api
      .buscarFollowUpLead(lead.id)
      .then((r) => {
        if (cancelado || !r) return;
        setSugestao(r);
        setMensagem(r.mensagem ?? "");
      })
      .catch(() => {
        // Lead sem sugestão salva é o caso normal: o dialog abre vazio, sem
        // toast. Só a geração explícita merece reportar erro.
      })
      .finally(() => {
        if (!cancelado) setCarregandoSalva(false);
      });

    return () => {
      cancelado = true;
    };
  }, [open, lead.id]);

  // O histórico só é buscado quando a aba é aberta. A maioria das visitas é
  // para gerar ou reler a última — não vale uma query a mais em todas elas.
  useEffect(() => {
    if (!open || aba !== "anteriores" || historicoCarregado) return;

    let cancelado = false;
    setCarregandoHistorico(true);
    api
      .listarFollowUpsDoLead(lead.id)
      .then((r) => {
        if (cancelado) return;
        setHistorico(r ?? []);
        setHistoricoCarregado(true);
      })
      .catch(() => {
        // Aba vazia com o texto de "nenhuma sugestão" já comunica o suficiente.
      })
      .finally(() => {
        if (!cancelado) setCarregandoHistorico(false);
      });

    return () => {
      cancelado = true;
    };
  }, [open, aba, lead.id, historicoCarregado]);

  const gerar = async () => {
    setGerando(true);
    try {
      const r = await api.gerarFollowUpLead(lead.id, { canal, tom });
      const texto = (r.mensagem ?? r.texto ?? "").trim();
      // Sugestão sem mensagem não pode virar card: o assessor copiaria nada,
      // sem sinal de que algo falhou.
      if (!texto) {
        toast({
          title: "Não foi possível gerar",
          description: "A IA não devolveu uma mensagem. Tente novamente.",
          variant: "destructive",
        });
        return;
      }
      setSugestao(r);
      setMensagem(texto);
      // A nova entrou no histórico: força recarregar na próxima visita à aba.
      setHistoricoCarregado(false);
    } catch (err) {
      toast({
        title: "Não foi possível gerar",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGerando(false);
    }
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensagem);
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
      return;
    }

    toast({
      title: "Mensagem copiada!",
      description: "Só a mensagem foi copiada — as demais seções são para você.",
    });

    // Registra a primeira cópia: é o único sinal de que a sugestão virou
    // contato de verdade. Falhar aqui não pode atrapalhar nada — o texto já
    // está na área de transferência.
    if (sugestao?.id && !sugestao.copiadaEm) {
      try {
        await api.marcarFollowUpCopiada(lead.id, sugestao.id);
        setSugestao((s) => (s ? { ...s, copiadaEm: new Date().toISOString() } : s));
      } catch {
        /* silencioso de propósito */
      }
    }
  };

  const contexto = sugestao?.contextoUtilizado ?? [];
  const leitura = sugestao?.leitura;
  const aprovado = sugestao?.qualidade?.aprovado !== false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-4 w-4 text-primary" />
            Sugestão de follow-up
          </DialogTitle>
          <DialogDescription>
            {lead.nome}
            {lead.cidade ? ` · ${lead.cidade}` : ""}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={aba} onValueChange={setAba}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="atual">Sugestão</TabsTrigger>
            <TabsTrigger value="anteriores">
              Anteriores{historico.length > 0 ? ` (${historico.length})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="atual" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Canal</Label>
              <Select value={canal} onValueChange={setCanal}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CANAIS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tom</Label>
              <Select value={tom} onValueChange={setTom}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONS.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={gerar}
            disabled={gerando || carregandoSalva}
            className="w-full gap-2"
          >
            {gerando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {gerando
              ? "Analisando o histórico..."
              : sugestao
                ? "Gerar nova sugestão"
                : "Gerar sugestão"}
          </Button>

          {sugestao?.criadaEm && !gerando && (
            <p className="text-center text-xs text-muted-foreground">
              Gerada em {format(new Date(sugestao.criadaEm), "dd/MM 'às' HH:mm", { locale: ptBR })}
              {sugestao.copiadaEm ? " · já copiada" : ""}
            </p>
          )}

          {(gerando || carregandoSalva) && !sugestao ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-24 w-full rounded-md" />
              <Skeleton className="h-32 w-full rounded-md" />
            </div>
          ) : null}

          {sugestao && (
            <div className="space-y-5">
              {!aprovado && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="space-y-1">
                    <p className="font-medium">Revise antes de enviar</p>
                    <ul className="list-disc pl-4 text-xs">
                      {sugestao.qualidade.falhas.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {sugestao.semContexto && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Este lead não tem briefing nem histórico registrado, então a IA tinha pouco
                    material. Registre um briefing para a próxima sugestão sair mais específica.
                  </AlertDescription>
                </Alert>
              )}

              {/* ── Objetivo ── */}
              <section className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-sm font-semibold">Objetivo</h3>
                  <Badge variant="secondary" className="text-[11px]">
                    {sugestao.objetivo.tipo}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{sugestao.objetivo.porQueAgora}</p>
              </section>

              {/* ── Contexto utilizado ── */}
              {contexto.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Quote className="h-3.5 w-3.5 text-primary" />
                    <h3 className="text-sm font-semibold">Contexto utilizado</h3>
                    {sugestao.comCarteira && (
                      <Badge variant="outline" className="gap-1 text-[11px]">
                        <Wallet className="h-3 w-3" />
                        com carteira
                      </Badge>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {contexto.map((c, i) => (
                      <li key={`${c.ancora}-${i}`} className="rounded-md border border-border bg-muted/30 p-2.5">
                        <p className="text-sm">{c.afirmacao}</p>
                        {/* A âncora é o trecho literal conferido no histórico —
                            é o que deixa o assessor validar em segundos. */}
                        <p className="mt-1 border-l-2 border-border pl-2 text-xs italic text-muted-foreground">
                          "{c.ancora}"
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {c.fonte}
                          {c.data ? ` · ${c.data}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <Separator />

              {/* ── A mensagem: a única parte que vai para o cliente ── */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Mensagem para o cliente</Label>
                  <span className="text-[11px] text-muted-foreground">{mensagem.length} caracteres</span>
                </div>
                <Textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  className="min-h-[160px] text-sm"
                />
                <Button variant="outline" size="sm" onClick={copiar} className="gap-2">
                  <Copy className="h-3.5 w-3.5" />
                  Copiar mensagem
                </Button>
              </section>

              {/* ── Justificativa ── */}
              {sugestao.justificativa && (
                <section className="space-y-1.5">
                  <h3 className="text-sm font-semibold">Por que essa abordagem</h3>
                  <p className="text-sm text-muted-foreground">{sugestao.justificativa}</p>
                </section>
              )}

              {/* ── Leitura do cliente: o raciocínio, recolhido por padrão ── */}
              {leitura && (
                <Accordion type="single" collapsible>
                  <AccordionItem value="leitura" className="border-b-0">
                    <AccordionTrigger className="py-2 text-sm font-semibold">
                      Leitura do cliente
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                      <p>{leitura.quemE}</p>
                      <Campo rotulo="Profissão" valor={leitura.profissao} />
                      <Campo rotulo="Setor" valor={leitura.setor} />
                      <Campo rotulo="Como ganha dinheiro" valor={leitura.comoGanhaDinheiro} />
                      <Campo rotulo="Estágio" valor={leitura.estagioRelacionamento} />
                      <Campo rotulo="Tom das conversas" valor={leitura.tomDasConversas} />
                      <ListaCampo rotulo="Interesses" itens={leitura.interesses} />
                      <ListaCampo rotulo="Dores" itens={leitura.dores} />
                      <ListaCampo rotulo="Objeções em aberto" itens={leitura.objecoesEmAberto} />
                      <ListaCampo rotulo="Pendências" itens={leitura.pendencias} />
                      <ListaCampo rotulo="Compromissos" itens={leitura.compromissosAssumidos} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          )}

          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Rascunho de apoio — revise e envie você mesmo. Nada é enviado automaticamente. Só a
            mensagem se destina ao cliente; as demais seções são para você.
          </p>
          </TabsContent>

          <TabsContent value="anteriores" className="mt-4">
            {carregandoHistorico ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full rounded-md" />
                <Skeleton className="h-20 w-full rounded-md" />
              </div>
            ) : historico.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma sugestão gerada para este lead ainda.
              </p>
            ) : (
              <ul className="space-y-3">
                {historico.map((h) => (
                  <li key={h.id ?? h.criadaEm} className="rounded-md border border-border p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-[11px]">
                        {h.objetivo.tipo}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(h.criadaEm), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      {h.copiadaEm && (
                        <Badge variant="outline" className="gap-1 text-[11px]">
                          <Copy className="h-3 w-3" />
                          copiada
                        </Badge>
                      )}
                      {!h.qualidade.aprovado && (
                        <Badge variant="destructive" className="text-[11px]">
                          ressalva
                        </Badge>
                      )}
                    </div>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">{h.mensagem}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 gap-1.5 px-2 text-xs"
                      onClick={() => {
                        // Traz a antiga para a aba principal, onde ela é
                        // editável e o Copiar registra o aproveitamento.
                        setSugestao(h);
                        setMensagem(h.mensagem);
                        setAba("atual");
                      }}
                    >
                      Abrir nesta tela
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

const Campo = ({ rotulo, valor }: { rotulo: string; valor: string | null }) =>
  valor ? (
    <p>
      <span className="font-medium text-foreground">{rotulo}:</span> {valor}
    </p>
  ) : null;

const ListaCampo = ({ rotulo, itens }: { rotulo: string; itens: string[] }) =>
  itens?.length ? (
    <p>
      <span className="font-medium text-foreground">{rotulo}:</span> {itens.join(" · ")}
    </p>
  ) : null;
