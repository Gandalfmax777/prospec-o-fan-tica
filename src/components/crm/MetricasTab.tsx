import { useMemo } from 'react';
import { useCRM } from '@/context/CRMContext';
import { KPICard } from './KPICard';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, isWithinInterval, endOfDay, endOfWeek, endOfMonth, endOfYear, differenceInDays } from 'date-fns';
import { Users, Calendar, TrendingUp, Clock, AlertTriangle, Target, Zap, MapPin, RotateCcw } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, Funnel, FunnelChart, LabelList, AreaChart, Area } from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

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
    const totalLeads = leads.length;
    const convertidos = leads.filter(l => l.status === 'Convertido');
    const ativos = leads.filter(l => l.status !== 'Convertido');

    // Por Cadência
    const porCadencia = {
      semanal: leads.filter(l => l.cadencia === 'Semanal').length,
      quinzenal: leads.filter(l => l.cadencia === 'Quinzenal').length,
      mensal: leads.filter(l => l.cadencia === 'Mensal').length,
    };

    // Leads por período
    const leadsHoje = leads.filter(l => isWithinInterval(l.dataEntrada, { start: inicioDia, end: fimDia })).length;
    const leadsSemana = leads.filter(l => isWithinInterval(l.dataEntrada, { start: inicioSemana, end: fimSemana })).length;
    const leadsMes = leads.filter(l => isWithinInterval(l.dataEntrada, { start: inicioMes, end: fimMes })).length;
    const leadsAno = leads.filter(l => isWithinInterval(l.dataEntrada, { start: inicioAno, end: fimAno })).length;

    // Taxa de conversão
    const taxaConversaoGeral = totalLeads > 0 ? (convertidos.length / totalLeads) * 100 : 0;
    
    const taxaConversaoPorCadencia = {
      semanal: porCadencia.semanal > 0 ? (convertidos.filter(l => l.cadencia === 'Semanal').length / porCadencia.semanal) * 100 : 0,
      quinzenal: porCadencia.quinzenal > 0 ? (convertidos.filter(l => l.cadencia === 'Quinzenal').length / porCadencia.quinzenal) * 100 : 0,
      mensal: porCadencia.mensal > 0 ? (convertidos.filter(l => l.cadencia === 'Mensal').length / porCadencia.mensal) * 100 : 0,
    };

    // Por Temperatura (funil)
    const porTemperatura = {
      frio: ativos.filter(l => l.temperatura === 'Frio').length,
      morno: ativos.filter(l => l.temperatura === 'Morno').length,
      quente: ativos.filter(l => l.temperatura === 'Quente').length,
      convertidos: convertidos.length,
    };

    // Por Origem
    const porOrigem = leads.reduce((acc, lead) => {
      const existing = acc.find(o => o.origem === lead.origem);
      if (existing) {
        existing.quantidade++;
        if (lead.status === 'Convertido') existing.convertidos++;
      } else {
        acc.push({ 
          origem: lead.origem, 
          quantidade: 1, 
          convertidos: lead.status === 'Convertido' ? 1 : 0 
        });
      }
      return acc;
    }, [] as { origem: string; quantidade: number; convertidos: number }[]);

    // Por Cidade
    const porCidade = leads.reduce((acc, lead) => {
      const existing = acc.find(c => c.cidade === lead.cidade);
      if (existing) {
        existing.quantidade++;
        if (lead.status === 'Convertido') existing.convertidos++;
      } else {
        acc.push({ 
          cidade: lead.cidade, 
          quantidade: 1, 
          convertidos: lead.status === 'Convertido' ? 1 : 0 
        });
      }
      return acc;
    }, [] as { cidade: string; quantidade: number; convertidos: number }[]).sort((a, b) => b.quantidade - a.quantidade).slice(0, 8);

    // Leads Atrasados
    const atrasados = ativos.filter(l => l.status === 'Atrasado').length;

    // Tempo médio de conversão
    const temposMediosConversao = convertidos
      .filter(l => l.dataConversao)
      .map(l => differenceInDays(l.dataConversao!, l.dataEntrada));
    const tempoMedioConversao = temposMediosConversao.length > 0 
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
    { name: 'Semanal', value: metricas.porCadencia.semanal },
    { name: 'Quinzenal', value: metricas.porCadencia.quinzenal },
    { name: 'Mensal', value: metricas.porCadencia.mensal },
  ];

  const funilData = [
    { name: 'Frio', value: metricas.porTemperatura.frio, fill: 'hsl(201, 96%, 52%)' },
    { name: 'Morno', value: metricas.porTemperatura.morno, fill: 'hsl(45, 93%, 47%)' },
    { name: 'Quente', value: metricas.porTemperatura.quente, fill: 'hsl(25, 95%, 53%)' },
    { name: 'Convertidos', value: metricas.porTemperatura.convertidos, fill: 'hsl(142, 71%, 45%)' },
  ];

  const taxaConversaoCadenciaData = [
    { cadencia: 'Semanal', taxa: metricas.taxaConversaoPorCadencia.semanal },
    { cadencia: 'Quinzenal', taxa: metricas.taxaConversaoPorCadencia.quinzenal },
    { cadencia: 'Mensal', taxa: metricas.taxaConversaoPorCadencia.mensal },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Métricas de Desempenho</h2>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Leads Hoje" value={metricas.leadsHoje} icon={Calendar} variant="primary" />
        <KPICard title="Leads Semana" value={metricas.leadsSemana} icon={Calendar} variant="primary" />
        <KPICard title="Leads Mês" value={metricas.leadsMes} icon={Users} variant="primary" />
        <KPICard title="Taxa Conversão" value={`${metricas.taxaConversaoGeral.toFixed(1)}%`} icon={TrendingUp} variant="success" />
        <KPICard title="Convertidos" value={metricas.convertidos} icon={Target} variant="success" />
        <KPICard title="Ativos no Funil" value={metricas.ativos} icon={Zap} variant="default" />
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Atrasados" value={metricas.atrasados} icon={AlertTriangle} variant="danger" />
        <KPICard title="Tempo Médio Conversão" value={`${metricas.tempoMedioConversao} dias`} icon={Clock} variant="default" />
        <KPICard title="Total de Leads" value={metricas.totalLeads} icon={Users} variant="default" />
        <KPICard title="Leads no Ano" value={metricas.leadsAno} icon={Calendar} variant="default" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cadência */}
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold mb-4">Leads por Cadência</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={cadenciaData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
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
        </div>

        {/* Funil de Vendas */}
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold mb-4">Funil de Vendas</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={funilData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {funilData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Taxa de Conversão por Cadência */}
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold mb-4">Taxa de Conversão por Cadência</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={taxaConversaoCadenciaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="cadencia" />
              <YAxis unit="%" />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              <Bar dataKey="taxa" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leads por Origem */}
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold mb-4">Leads por Origem</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={metricas.porOrigem}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="origem" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantidade" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="convertidos" name="Convertidos" fill="hsl(var(--status-em-dia))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversão por Cidade */}
        <div className="bg-card rounded-xl p-6 border lg:col-span-2">
          <h3 className="font-semibold mb-4">Performance por Cidade</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricas.porCidade}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="cidade" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantidade" name="Total Leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="convertidos" name="Convertidos" fill="hsl(var(--status-em-dia))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
