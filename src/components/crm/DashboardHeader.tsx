import { useState } from "react";
import { format, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { useCRM } from "@/context/CRMContext";
import { KPICard } from "./KPICard";
import { Button } from "@/components/ui/button";
import { BriefingDialog } from "./BriefingDialog";
import { Lead } from "@/types/crm";
import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  CheckCircle,
  DollarSign,
  Flame,
  MessageSquare,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
];
const META_DIARIA = {
  contatos: 5,
  atrasosResolvidos: 3,
  followUps: 5,
};

export const DashboardHeader = () => {
  const { leads, metricasDiarias, registrarContato } = useCRM();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);

  // Garantir que leads seja sempre um array
  const leadsArray = Array.isArray(leads) ? leads : [];

  // Perdidos saem das visões ativas (não poluem funil, follow-ups, gráficos nem totais).
  const naoPerdidos = leadsArray.filter((lead) => lead.status !== "Perdido");

  const ativos = naoPerdidos.filter((lead) => lead.status !== "Convertido");
  const atrasadosLeads = ativos.filter((lead) => lead.status === "Atrasado");
  const falarHojeLeads = ativos.filter((lead) => lead.status === "Falar Hoje");
  const atrasados = atrasadosLeads.length;
  const falarHoje = falarHojeLeads.length;
  const emDia = ativos.filter((lead) => lead.status === "Em Dia").length;
  const convertidos = leadsArray.filter((lead) => lead.status === "Convertido").length;

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const followUpsToday = naoPerdidos.flatMap((lead) => {
    const briefings = Array.isArray(lead.briefings) ? lead.briefings : [];
    return briefings
      .filter(
        (briefing) =>
          briefing.proximoFollowUp &&
          isWithinInterval(briefing.proximoFollowUp, {
            start: todayStart,
            end: todayEnd,
          })
      )
      .map((briefing) => ({
        lead,
        followUpDate: briefing.proximoFollowUp,
      }));
  });

  const followUpsCount = followUpsToday.length;

  const porCadencia = [
    {
      name: "Semanal",
      value: naoPerdidos.filter((lead) => lead.cadencia === "Semanal").length,
    },
    {
      name: "Quinzenal",
      value: naoPerdidos.filter((lead) => lead.cadencia === "Quinzenal").length,
    },
    {
      name: "Mensal",
      value: naoPerdidos.filter((lead) => lead.cadencia === "Mensal").length,
    },
  ];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);

  const totalStatedAtivos = ativos.reduce(
    (acc, lead) => acc + (lead.statedValueCents ?? 0),
    0
  );
  const totalStatedConvertidos = leads
    .filter((lead) => lead.status === "Convertido")
    .reduce((acc, lead) => acc + (lead.statedValueCents ?? 0), 0);

  // O tipo é explícito porque o array mistura três formatos: só os follow-ups
  // carregam `date`. Sem a anotação, o TS reduz ao denominador comum e o acesso
  // a `item.date` na renderização vira erro.
  const myDayItems: Array<{
    key: string;
    lead: Lead;
    label: string;
    date?: Date | null;
  }> = [
    ...atrasadosLeads.map((lead) => ({
      key: `atrasado-${lead.id}`,
      lead,
      label: "Atrasado",
    })),
    ...falarHojeLeads.map((lead) => ({
      key: `falar-hoje-${lead.id}`,
      lead,
      label: "Falar Hoje",
    })),
    ...followUpsToday.map((item, index) => ({
      key: `followup-${item.lead.id}-${index}`,
      lead: item.lead,
      label: "Follow-up",
      date: item.followUpDate,
    })),
  ];

  const handleRegistrarContato = async (lead: Lead) => {
    try {
      await registrarContato(lead.id);
    } catch (err) {
      console.error("Erro ao registrar contato:", err);
    }
  };

  const handleAbrirBriefing = (lead: Lead) => {
    setSelectedLead(lead);
    setShowBriefing(true);
  };

  const totalRealizado =
    metricasDiarias.contatosFeitos +
    metricasDiarias.atrasosResolvidos +
    metricasDiarias.leadsQuentesTrabalhados;
  const metaTotal =
    META_DIARIA.contatos + META_DIARIA.atrasosResolvidos + META_DIARIA.followUps;
  const progressoPercentual = Math.min((totalRealizado / metaTotal) * 100, 100);

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg font-semibold">Progresso do dia</CardTitle>
          </div>
          <span className="text-3xl font-bold text-primary">
            {progressoPercentual.toFixed(0)}%
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressoPercentual} className="h-3 shadow-sm" />
          <div className="flex flex-wrap gap-4 md:gap-6 text-sm">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <div className="p-1.5 rounded-md bg-primary/10">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <span>Contatos: <strong className="text-foreground font-semibold">{metricasDiarias.contatosFeitos}/{META_DIARIA.contatos}</strong></span>
            </span>
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <div className="p-1.5 rounded-md bg-[hsl(var(--success))/0.1]">
                <CheckCircle className="h-4 w-4 text-[hsl(var(--success))]" />
              </div>
              <span>Atrasos resolvidos: <strong className="text-foreground font-semibold">{metricasDiarias.atrasosResolvidos}/{META_DIARIA.atrasosResolvidos}</strong></span>
            </span>
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <div className="p-1.5 rounded-md bg-[hsl(var(--warning))/0.1]">
                <Flame className="h-4 w-4 text-[hsl(var(--warning))]" />
              </div>
              <span>Follow-ups: <strong className="text-foreground font-semibold">{metricasDiarias.leadsQuentesTrabalhados}/{META_DIARIA.followUps}</strong></span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">Indicadores principais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative -mx-2 px-2">
            <div className="overflow-x-auto scrollbar-thin pb-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
                <div className="min-w-[140px] sm:min-w-[150px] md:min-w-[160px]">
                  <KPICard title="Total Prospects" value={naoPerdidos.length} icon={Users} variant="primary" />
                </div>
                <div className="min-w-[140px] sm:min-w-[150px] md:min-w-[160px]">
                  <KPICard title="Atrasados" value={atrasados} icon={AlertTriangle} variant="danger" />
                </div>
                <div className="min-w-[140px] sm:min-w-[150px] md:min-w-[160px]">
                  <KPICard title="Falar Hoje" value={falarHoje} icon={MessageSquare} variant="warning" />
                </div>
                <div className="min-w-[140px] sm:min-w-[150px] md:min-w-[160px]">
                  <KPICard title="Em Dia" value={emDia} icon={CheckCircle} variant="success" />
                </div>
                <div className="min-w-[140px] sm:min-w-[150px] md:min-w-[160px]">
                  <KPICard title="Convertidos" value={convertidos} icon={TrendingUp} variant="success" />
                </div>
                <div className="min-w-[140px] sm:min-w-[150px] md:min-w-[160px]">
                  <KPICard
                    title="Quentes"
                    value={ativos.filter((lead) => lead.temperatura === "Quente").length}
                    icon={Flame}
                    variant="default"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPICard title="Valor ativo" value={formatCurrency(totalStatedAtivos)} icon={DollarSign} variant="primary" />
            <KPICard
              title="Valor convertido"
              value={formatCurrency(totalStatedConvertidos)}
              icon={DollarSign}
              variant="success"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <CalendarCheck className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-semibold">Meu dia</CardTitle>
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              {format(new Date(), "dd/MM/yyyy")}
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <div className="rounded-lg border border-border/50 bg-muted/40 p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <p className="text-xs text-muted-foreground mb-1">Atrasados</p>
                <p className="text-2xl font-bold text-foreground">{atrasados}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-muted/40 p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <p className="text-xs text-muted-foreground mb-1">Falar Hoje</p>
                <p className="text-2xl font-bold text-foreground">{falarHoje}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-muted/40 p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <p className="text-xs text-muted-foreground mb-1">Follow-ups</p>
                <p className="text-2xl font-bold text-foreground">{followUpsCount}</p>
              </div>
            </div>
            <div className="space-y-2">
              {myDayItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nada pendente para hoje.</p>
                </div>
              ) : (
                myDayItems.slice(0, 8).map((item) => (
                  <div
                    key={item.key}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/60 p-3 shadow-sm hover:shadow-md hover:bg-background/80 transition-all duration-200"
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.lead.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.label}
                        {item.date ? ` - ${format(item.date, "dd/MM")}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleRegistrarContato(item.lead)}
                        className="hover:bg-primary/10 hover:border-primary/20 transition-colors"
                      >
                        Registrar contato
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleAbrirBriefing(item.lead)}
                        className="bg-primary hover:bg-primary/90 transition-colors"
                      >
                        Abrir briefing
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg font-semibold">Cadencia dos leads</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] md:h-[300px] lg:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={porCadencia}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  isAnimationActive={true}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {porCadencia.map((_, index) => (
                    <Cell 
                      key={`cadencia-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      const total = porCadencia.reduce((sum, item) => sum + item.value, 0);
                      const percent = total > 0 ? (((data.value as number) / total) * 100).toFixed(1) : "0";
                      return (
                        <div className="rounded-lg border border-border/50 bg-popover p-3 shadow-md">
                          <p className="font-semibold text-foreground">{data.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {data.value} ({percent}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                  contentStyle={{
                    backgroundColor: "transparent",
                    border: "none",
                    boxShadow: "none",
                  }}
                />
                <Legend 
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                  iconType="circle"
                  wrapperStyle={{ 
                    fontSize: "14px", 
                    paddingTop: "16px",
                    color: "hsl(var(--foreground))"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {selectedLead && (
        <BriefingDialog
          open={showBriefing}
          onOpenChange={setShowBriefing}
          lead={selectedLead}
        />
      )}
    </div>
  );
};
