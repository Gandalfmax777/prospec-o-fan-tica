import { useCRM } from "@/context/CRMContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trophy, Star, Target, Zap, Award, TrendingUp, CheckCircle, Flame, AlertTriangle } from "lucide-react";

const NIVEL_CONFIG = {
  "Prospectador Iniciante": { icon: Star, color: "text-[hsl(var(--silver))]", minPontos: 0 },
  "Persistente": { icon: Zap, color: "text-[hsl(var(--bronze))]", minPontos: 51 },
  "Consistente": { icon: Target, color: "text-[hsl(var(--gold))]", minPontos: 151 },
  "Cadencia Master": { icon: Award, color: "text-primary", minPontos: 301 },
  "Closer": { icon: Trophy, color: "text-[hsl(var(--status-em-dia))]", minPontos: 600 },
};

const CONQUISTAS_CONFIG: Record<string, { descricao: string; icon: typeof Trophy }> = {
  "Tempo Real": { descricao: "Zerou atrasados do dia", icon: CheckCircle },
  "Closer da Semana": { descricao: "3 conversoes na semana", icon: Trophy },
  "Insistente": { descricao: "20 follow-ups realizados", icon: Zap },
  "Zero Atraso": { descricao: "5 dias sem atraso", icon: Star },
  "Quente!": { descricao: "10 leads esquentados", icon: Flame },
  "Ritmo Perfeito": { descricao: "Cadencia feita por 7 dias", icon: Target },
};

export const GamificacaoTab = () => {
  const { gamificacao, metricasDiarias, leads } = useCRM();

  const nivelAtual = gamificacao.nivel as keyof typeof NIVEL_CONFIG;
  const NivelIcon = NIVEL_CONFIG[nivelAtual]?.icon || Star;
  const nivelColor = NIVEL_CONFIG[nivelAtual]?.color || "text-muted-foreground";

  const niveis = Object.entries(NIVEL_CONFIG).sort((a, b) => a[1].minPontos - b[1].minPontos);
  const nivelAtualIndex = niveis.findIndex(([nome]) => nome === nivelAtual);
  const proximoNivel = niveis[nivelAtualIndex + 1];
  const pontosParaProximo = proximoNivel ? proximoNivel[1].minPontos - gamificacao.pontosMes : 0;
  const progressoNivel = proximoNivel
    ? ((gamificacao.pontosMes - NIVEL_CONFIG[nivelAtual].minPontos) /
        (proximoNivel[1].minPontos - NIVEL_CONFIG[nivelAtual].minPontos)) *
      100
    : 100;

  const todasConquistas = leads.flatMap((lead) => lead.conquistas);
  const conquistasUnicas = [...new Set(todasConquistas)];

  const getMensagemMotivacional = () => {
    const taxa = metricasDiarias.taxaRitmo || (metricasDiarias.contatosFeitos / 10) * 100;
    if (taxa >= 100) return "Dia incrivel! Voce esta arrasando!";
    if (taxa >= 75) return "Excelente progresso! Continue assim!";
    if (taxa >= 50) return "Bom trabalho! Mais um pouco e voce bate a meta!";
    if (taxa >= 25) return "Vamos la! Voce consegue!";
    return "Hora de comecar! Cada contato conta!";
  };

  // Verificar se está inativo (sem pontos hoje e última atividade não é hoje)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const ultimaAtividade = gamificacao.ultimaAtividade
    ? new Date(gamificacao.ultimaAtividade)
    : null;
  
  const ultimaAtividadeDate = ultimaAtividade
    ? (() => {
        const date = new Date(ultimaAtividade);
        date.setHours(0, 0, 0, 0);
        return date;
      })()
    : null;
  
  const ultimaAtividadeHoje = ultimaAtividadeDate
    ? ultimaAtividadeDate.getTime() === hoje.getTime()
    : false;
  
  const estaInativo = gamificacao.pontosHoje === 0 && !ultimaAtividadeHoje;

  return (
    <div className="space-y-6 pb-0">
      {estaInativo && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção: Inatividade detectada</AlertTitle>
          <AlertDescription>
            Você não ganhou pontos hoje. Se não realizar nenhuma ação, perderá <strong>5 pontos</strong> ao final do dia.
            Comece a trabalhar para evitar a penalidade!
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Resumo do dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{metricasDiarias.contatosFeitos}</p>
              <p className="text-sm text-muted-foreground">Contatos feitos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[hsl(var(--status-em-dia))]">{metricasDiarias.atrasosResolvidos}</p>
              <p className="text-sm text-muted-foreground">Atrasos resolvidos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{metricasDiarias.novosLeads}</p>
              <p className="text-sm text-muted-foreground">Novos leads</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[hsl(var(--temp-quente))]">{metricasDiarias.leadsQuentesTrabalhados}</p>
              <p className="text-sm text-muted-foreground">Leads quentes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{gamificacao.pontosHoje}</p>
              <p className="text-sm text-muted-foreground">Pontos hoje</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso diario</span>
              <span>{gamificacao.progressoDiario.toFixed(0)}%</span>
            </div>
            <Progress value={gamificacao.progressoDiario} className="h-3" />
          </div>

          <p className="text-center mt-4 text-lg font-medium">{getMensagemMotivacional()}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Seu nivel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <div className="relative inline-block">
                <NivelIcon className={`w-20 h-20 mx-auto ${nivelColor} drop-shadow-lg`} />
                <Badge 
                  className={`absolute -bottom-2 left-1/2 -translate-x-1/2 ${nivelColor.replace('text-', 'bg-')} text-white border-2 border-background`}
                >
                  {nivelAtual}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-6">{gamificacao.pontosMes} pontos no mes</p>
            </div>

            {proximoNivel && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Proximo: {proximoNivel[0]}</span>
                  <span className="text-primary">{pontosParaProximo} pts restantes</span>
                </div>
                <Progress 
                  value={progressoNivel} 
                  className="h-3 bg-muted"
                />
                <p className="text-xs text-muted-foreground text-center">
                  {Math.round(progressoNivel)}% completo
                </p>
              </div>
            )}

            <div className="pt-4 border-t space-y-3">
              <h4 className="text-sm font-semibold text-center mb-2">Todos os Níveis</h4>
              <div className="space-y-2">
                {niveis.map(([nome, config], index) => {
                  const Icon = config.icon;
                  const isAtual = nome === nivelAtual;
                  const isAlcancado = gamificacao.pontosMes >= config.minPontos;
                  const proximoNaoAlcancado = index < niveis.length - 1 && 
                    gamificacao.pontosMes < niveis[index + 1][1].minPontos && 
                    !isAlcancado;
                  
                  return (
                    <div
                      key={nome}
                      className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${
                        isAtual
                          ? "bg-primary/10 border-primary shadow-sm"
                          : isAlcancado
                          ? "bg-muted/30 border-border opacity-75"
                          : "bg-background border-border opacity-50"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isAtual
                            ? config.color
                            : isAlcancado
                            ? "text-muted-foreground"
                            : "text-muted-foreground/50"
                        }`}
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isAtual ? "text-primary" : ""}`}>
                          {nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {config.minPontos} pontos
                        </p>
                      </div>
                      {isAtual && (
                        <Badge variant="default" className="text-xs">Atual</Badge>
                      )}
                      {isAlcancado && !isAtual && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t">
              <div className="text-center">
                <p className="text-lg font-bold">{gamificacao.pontosHoje}</p>
                <p className="text-xs text-muted-foreground">Hoje</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{gamificacao.pontosSemana}</p>
                <p className="text-xs text-muted-foreground">Semana</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{gamificacao.pontosMes}</p>
                <p className="text-xs text-muted-foreground">Mes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Missoes do dia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seção de Missões */}
            <div className="space-y-3">
              {gamificacao.missoesDiarias.map((missao) => (
                <div key={missao.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${missao.concluida ? "line-through text-muted-foreground" : ""}`}>
                      {missao.descricao}
                    </span>
                    <Badge variant={missao.concluida ? "default" : "secondary"}>+{missao.pontos} pts</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(missao.progresso / missao.meta) * 100} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {missao.progresso}/{missao.meta}
                    </span>
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  Complete todas para ganhar <strong>+20 pontos</strong> de bonus!
                </p>
              </div>
            </div>

            {/* Separador visual e Seção de Conquistas */}
            <div className="pt-4 border-t">
              <CardTitle className="flex items-center gap-2 text-base mb-3">
                <Award className="w-5 h-5" />
                Conquistas
              </CardTitle>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(CONQUISTAS_CONFIG).map(([nome, config]) => {
                  const conquistada = conquistasUnicas.includes(nome);
                  const Icon = config.icon;
                  return (
                    <div
                      key={nome}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        conquistada ? "bg-primary/10 border-primary" : "bg-muted/30 border-border opacity-50"
                      }`}
                    >
                      <Icon className={`w-8 h-8 mx-auto ${conquistada ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="text-xs font-medium mt-1">{nome}</p>
                      <p className="text-[10px] text-muted-foreground">{config.descricao}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-0">
        <CardHeader>
          <CardTitle>Como ganhar e perder pontos</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2 text-primary">Ganhar Pontos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg border border-primary/20">
                  <p className="font-bold text-lg text-primary">+3 pts</p>
                  <p className="text-sm">Registrar contato</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border border-primary/20">
                  <p className="font-bold text-lg text-primary">+5 pts</p>
                  <p className="text-sm">Resolver atraso</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border border-primary/20">
                  <p className="font-bold text-lg text-primary">+2 pts</p>
                  <p className="text-sm">Novo lead</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border border-primary/20">
                  <p className="font-bold text-lg text-primary">+3 pts</p>
                  <p className="text-sm">Mover para Morno</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border border-primary/20">
                  <p className="font-bold text-lg text-primary">+5 pts</p>
                  <p className="text-sm">Mover para Quente</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border border-primary/20">
                  <p className="font-bold text-lg text-primary">+10 pts</p>
                  <p className="text-sm">Converter lead</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border border-primary/20">
                  <p className="font-bold text-lg text-primary">+2 pts</p>
                  <p className="text-sm">Preencher briefing</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border border-primary/20">
                  <p className="font-bold text-lg text-primary">+20 pts</p>
                  <p className="text-sm">Completar missoes</p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2 text-destructive">Perder Pontos</h4>
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="font-bold text-lg text-destructive">-5 pts</p>
                <p className="text-sm">Inatividade (sem ações no dia)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Se você não ganhar nenhum ponto durante o dia, perderá 5 pontos ao final do dia.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
