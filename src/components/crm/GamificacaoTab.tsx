import { useCRM } from '@/context/CRMContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Target, Zap, Award, TrendingUp, CheckCircle, Flame } from 'lucide-react';

const NIVEL_CONFIG = {
  'Prospectador Iniciante': { icon: Star, color: 'text-[hsl(var(--silver))]', minPontos: 0 },
  'Persistente': { icon: Zap, color: 'text-[hsl(var(--bronze))]', minPontos: 51 },
  'Consistente': { icon: Target, color: 'text-[hsl(var(--gold))]', minPontos: 151 },
  'Cadência Master': { icon: Award, color: 'text-primary', minPontos: 301 },
  'Closer': { icon: Trophy, color: 'text-[hsl(var(--status-em-dia))]', minPontos: 600 },
};

const CONQUISTAS_CONFIG: Record<string, { descricao: string; icon: typeof Trophy }> = {
  'Tempo Real': { descricao: 'Zerou atrasados do dia', icon: CheckCircle },
  'Closer da Semana': { descricao: '3 conversões na semana', icon: Trophy },
  'Insistente': { descricao: '20 follow-ups realizados', icon: Zap },
  'Zero Atraso': { descricao: '5 dias sem atraso', icon: Star },
  'Quente!': { descricao: '10 leads esquentados', icon: Flame },
  'Ritmo Perfeito': { descricao: 'Cadência feita por 7 dias', icon: Target },
};

export const GamificacaoTab = () => {
  const { gamificacao, metricasDiarias, leads } = useCRM();

  const nivelAtual = gamificacao.nivel as keyof typeof NIVEL_CONFIG;
  const NivelIcon = NIVEL_CONFIG[nivelAtual]?.icon || Star;
  const nivelColor = NIVEL_CONFIG[nivelAtual]?.color || 'text-muted-foreground';

  // Calcular progresso para próximo nível
  const niveis = Object.entries(NIVEL_CONFIG).sort((a, b) => a[1].minPontos - b[1].minPontos);
  const nivelAtualIndex = niveis.findIndex(([nome]) => nome === nivelAtual);
  const proximoNivel = niveis[nivelAtualIndex + 1];
  const pontosParaProximo = proximoNivel ? proximoNivel[1].minPontos - gamificacao.pontosMes : 0;
  const progressoNivel = proximoNivel 
    ? ((gamificacao.pontosMes - NIVEL_CONFIG[nivelAtual].minPontos) / (proximoNivel[1].minPontos - NIVEL_CONFIG[nivelAtual].minPontos)) * 100
    : 100;

  // Conquistas dos leads
  const todasConquistas = leads.flatMap(l => l.conquistas);
  const conquistasUnicas = [...new Set(todasConquistas)];

  // Mensagem motivacional
  const getMensagemMotivacional = () => {
    const taxa = metricasDiarias.taxaRitmo || (metricasDiarias.contatosFeitos / 10) * 100;
    if (taxa >= 100) return '🔥 Dia incrível! Você está arrasando!';
    if (taxa >= 75) return '💪 Excelente progresso! Continue assim!';
    if (taxa >= 50) return '👍 Bom trabalho! Mais um pouco e você bate a meta!';
    if (taxa >= 25) return '🚀 Vamos lá! Você consegue!';
    return '💡 Hora de começar! Cada contato conta!';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Gamificação & Desempenho</h2>

      {/* Resumo do Dia */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Resumo do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{metricasDiarias.contatosFeitos}</p>
              <p className="text-sm text-muted-foreground">Contatos Feitos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[hsl(var(--status-em-dia))]">{metricasDiarias.atrasosResolvidos}</p>
              <p className="text-sm text-muted-foreground">Atrasos Resolvidos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{metricasDiarias.novosLeads}</p>
              <p className="text-sm text-muted-foreground">Novos Leads</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[hsl(var(--temp-quente))]">{metricasDiarias.leadsQuentesTrabalhados}</p>
              <p className="text-sm text-muted-foreground">Leads Quentes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{gamificacao.pontosHoje}</p>
              <p className="text-sm text-muted-foreground">Pontos Hoje</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso Diário</span>
              <span>{gamificacao.progressoDiario.toFixed(0)}%</span>
            </div>
            <Progress value={gamificacao.progressoDiario} className="h-3" />
          </div>

          <p className="text-center mt-4 text-lg font-medium">{getMensagemMotivacional()}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nível e Pontos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Seu Nível
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <NivelIcon className={`w-16 h-16 mx-auto ${nivelColor}`} />
              <h3 className="text-xl font-bold mt-2">{nivelAtual}</h3>
              <p className="text-sm text-muted-foreground">{gamificacao.pontosMes} pontos no mês</p>
            </div>

            {proximoNivel && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Próximo: {proximoNivel[0]}</span>
                  <span>{pontosParaProximo} pts restantes</span>
                </div>
                <Progress value={progressoNivel} className="h-2" />
              </div>
            )}

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
                <p className="text-xs text-muted-foreground">Mês</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Missões Diárias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Missões do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {gamificacao.missoesDiarias.map(missao => (
              <div key={missao.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${missao.concluida ? 'line-through text-muted-foreground' : ''}`}>
                    {missao.descricao}
                  </span>
                  <Badge variant={missao.concluida ? 'default' : 'secondary'}>
                    +{missao.pontos} pts
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={(missao.progresso / missao.meta) * 100} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground">
                    {missao.progresso}/{missao.meta}
                  </span>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Complete todas para ganhar <strong>+20 pontos</strong> de bônus!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Conquistas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(CONQUISTAS_CONFIG).map(([nome, config]) => {
                const conquistada = conquistasUnicas.includes(nome);
                const Icon = config.icon;
                return (
                  <div
                    key={nome}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      conquistada 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-muted/30 border-border opacity-50'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mx-auto ${conquistada ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="text-xs font-medium mt-1">{nome}</p>
                    <p className="text-[10px] text-muted-foreground">{config.descricao}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Pontuação */}
      <Card>
        <CardHeader>
          <CardTitle>Como Ganhar Pontos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-bold text-lg text-primary">+3 pts</p>
              <p className="text-sm">Registrar contato</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-bold text-lg text-primary">+5 pts</p>
              <p className="text-sm">Resolver atraso</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-bold text-lg text-primary">+2 pts</p>
              <p className="text-sm">Novo lead</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-bold text-lg text-primary">+3 pts</p>
              <p className="text-sm">Mover para Morno</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-bold text-lg text-primary">+5 pts</p>
              <p className="text-sm">Mover para Quente</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-bold text-lg text-primary">+10 pts</p>
              <p className="text-sm">Converter lead</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-bold text-lg text-primary">+2 pts</p>
              <p className="text-sm">Preencher briefing</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-bold text-lg text-primary">+20 pts</p>
              <p className="text-sm">Completar missões</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
