import { useMemo } from "react";
import { useCRM } from "@/context/CRMContext";
import { KPICard } from "./KPICard";
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  isWithinInterval,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
  differenceInDays,
} from "date-fns";
import {
  Users,
  Calendar,
  TrendingUp,
  Clock,
  AlertTriangle,
  Target,
  Zap,
  ChartPie,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export const MetricasTab = () => {
  const { leads } = useCRM();

  const hoje = new Date();
  const inicioDia = startOfDay(hoje);
  const fimDia = endOfDay(hoje);
  const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
  const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);
  const inicioAno = startOfYear(hoje);
  const fimAno = endOfYear(hoje);

  const metricas = useMemo(() => {
    // Perdidos saem das métricas: não são leads ativos nem contam nos totais/taxas.
    const leadsBase = leads.filter((lead) => lead.status !== "Perdido");
    const totalLeads = leadsBase.length;
    const convertidos = leadsBase.filter((lead) => lead.status === "Convertido");
    const ativos = leadsBase.filter((lead) => lead.status !== "Convertido");

    const porCadencia = {
      semanal: leadsBase.filter((lead) => lead.cadencia === "Semanal").length,
      quinzenal: leadsBase.filter((lead) => lead.cadencia === "Quinzenal").length,
      mensal: leadsBase.filter((lead) => lead.cadencia === "Mensal").length,
    };

    const leadsHoje = leadsBase.filter((lead) =>
      isWithinInterval(lead.dataEntrada, { start: inicioDia, end: fimDia })
    ).length;
    const leadsSemana = leadsBase.filter((lead) =>
      isWithinInterval(lead.dataEntrada, { start: inicioSemana, end: fimSemana })
    ).length;
    const leadsMes = leadsBase.filter((lead) =>
      isWithinInterval(lead.dataEntrada, { start: inicioMes, end: fimMes })
    ).length;
    const leadsAno = leadsBase.filter((lead) =>
      isWithinInterval(lead.dataEntrada, { start: inicioAno, end: fimAno })
    ).length;

    const taxaConversaoGeral = totalLeads > 0 ? (convertidos.length / totalLeads) * 100 : 0;

    const taxaConversaoPorCadencia = {
      semanal:
        porCadencia.semanal > 0
          ? (convertidos.filter((lead) => lead.cadencia === "Semanal").length / porCadencia.semanal) * 100
          : 0,
      quinzenal:
        porCadencia.quinzenal > 0
          ? (convertidos.filter((lead) => lead.cadencia === "Quinzenal").length / porCadencia.quinzenal) * 100
          : 0,
      mensal:
        porCadencia.mensal > 0
          ? (convertidos.filter((lead) => lead.cadencia === "Mensal").length / porCadencia.mensal) * 100
          : 0,
    };

    const porTemperatura = {
      frio: ativos.filter((lead) => lead.temperatura === "Frio").length,
      morno: ativos.filter((lead) => lead.temperatura === "Morno").length,
      quente: ativos.filter((lead) => lead.temperatura === "Quente").length,
      convertidos: convertidos.length,
    };

    const porOrigem = leadsBase.reduce((acc, lead) => {
      const existing = acc.find((item) => item.origem === lead.origem);
      if (existing) {
        existing.quantidade++;
        if (lead.status === "Convertido") existing.convertidos++;
      } else {
        acc.push({
          origem: lead.origem,
          quantidade: 1,
          convertidos: lead.status === "Convertido" ? 1 : 0,
        });
      }
      return acc;
    }, [] as { origem: string; quantidade: number; convertidos: number }[]);

    const porCidade = leadsBase
      .reduce((acc, lead) => {
        const existing = acc.find((item) => item.cidade === lead.cidade);
        if (existing) {
          existing.quantidade++;
          if (lead.status === "Convertido") existing.convertidos++;
        } else {
          acc.push({
            cidade: lead.cidade,
            quantidade: 1,
            convertidos: lead.status === "Convertido" ? 1 : 0,
          });
        }
        return acc;
      }, [] as { cidade: string; quantidade: number; convertidos: number }[])
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 8);

    const atrasados = ativos.filter((lead) => lead.status === "Atrasado").length;

    const temposMediosConversao = convertidos
      .filter((lead) => lead.dataConversao)
      .map((lead) => differenceInDays(lead.dataConversao!, lead.dataEntrada));
    const tempoMedioConversao =
      temposMediosConversao.length > 0
        ? Math.round(temposMediosConversao.reduce((a, b) => a + b, 0) / temposMediosConversao.length)
        : 0;

    return {
      totalLeads,
      convertidos: convertidos.length,
      ativos: ativos.length,
      porCadencia,
      leadsHoje,
      leadsSemana,
      leadsMes,
      leadsAno,
      taxaConversaoGeral,
      taxaConversaoPorCadencia,
      porTemperatura,
      porOrigem,
      porCidade,
      atrasados,
      tempoMedioConversao,
    };
  }, [leads, inicioDia, fimDia, inicioSemana, fimSemana, inicioMes, fimMes, inicioAno, fimAno]);

  const cadenciaData = [
    { name: "Semanal", value: metricas.porCadencia.semanal },
    { name: "Quinzenal", value: metricas.porCadencia.quinzenal },
    { name: "Mensal", value: metricas.porCadencia.mensal },
  ];

  const funilData = [
    { name: "Frio", value: metricas.porTemperatura.frio, fill: "hsl(201, 96%, 52%)" },
    { name: "Morno", value: metricas.porTemperatura.morno, fill: "hsl(45, 93%, 47%)" },
    { name: "Quente", value: metricas.porTemperatura.quente, fill: "hsl(25, 95%, 53%)" },
    { name: "Convertidos", value: metricas.porTemperatura.convertidos, fill: "hsl(142, 71%, 45%)" },
  ];

  const taxaConversaoCadenciaData = [
    { cadencia: "Semanal", taxa: metricas.taxaConversaoPorCadencia.semanal },
    { cadencia: "Quinzenal", taxa: metricas.taxaConversaoPorCadencia.quinzenal },
    { cadencia: "Mensal", taxa: metricas.taxaConversaoPorCadencia.mensal },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <ChartPie className="h-5 w-5 text-primary" />
          <CardTitle>Metricas de desempenho</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative -mx-2 px-2">
            <div className="overflow-x-auto scrollbar-thin pb-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="min-w-[140px] sm:min-w-[150px] md:min-w-[160px]">
                  <KPICard title="Contatos hoje" value={metricas.leadsHoje} icon={Calendar} variant="primary" />
                </div>
                <div className="min-w-[140px] sm:min-w-[150px] md:min-w-[160px]">
                  <KPICard title="Contatos semana" value={metricas.leadsSemana} icon={Calendar} variant="primary" />
                </div>
                <div className="min-w-[140px] sm:min-w-[150px] md:min-w-[160px]">
                  <KPICard title="Contatos mês" value={metricas.leadsMes} icon={Users} variant="primary" />
                </div>
                <div className="min-w-[140px] sm:min-w-[150px] md:min-w-[160px]">
                  <KPICard title="Taxa conversao" value={`${metricas.taxaConversaoGeral.toFixed(1)}%`} icon={TrendingUp} variant="success" />
                </div>
                <div className="min-w-[140px] sm:min-w-[150px] md:min-w-[160px]">
                  <KPICard title="Convertidos" value={metricas.convertidos} icon={Target} variant="success" />
                </div>
                <div className="min-w-[140px] sm:min-w-[150px] md:min-w-[160px]">
                  <KPICard title="Ativos no funil" value={metricas.ativos} icon={Zap} variant="primary" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Atrasados" value={metricas.atrasados} icon={AlertTriangle} variant="danger" />
            <KPICard title="Tempo medio conversao" value={`${metricas.tempoMedioConversao} dias`} icon={Clock} variant="default" />
            <KPICard title="Total de contatos" value={metricas.totalLeads} icon={Users} variant="default" />
            <KPICard title="Contatos no ano" value={metricas.leadsAno} icon={Calendar} variant="default" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contatos por cadência</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] md:h-[250px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cadenciaData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {cadenciaData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funil de vendas</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] md:h-[250px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funilData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={60} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funilData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taxa de conversao por cadencia</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] md:h-[250px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taxaConversaoCadenciaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="cadencia" tick={{ fontSize: 10 }} />
                <YAxis unit="%" tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Bar dataKey="taxa" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contatos por origem</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] md:h-[250px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricas.porOrigem}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="origem" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={50} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantidade" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="convertidos" name="Convertidos" fill="hsl(var(--status-em-dia))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance por cidade</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] md:h-[280px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricas.porCidade}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="cidade" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantidade" name="Total contatos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="convertidos" name="Convertidos" fill="hsl(var(--status-em-dia))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
