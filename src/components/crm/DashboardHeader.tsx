import { useCRM } from '@/context/CRMContext';
import { KPICard } from './KPICard';
import { Users, AlertTriangle, MessageSquare, CheckCircle, TrendingUp, Flame, Target } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Progress } from '@/components/ui/progress';
const COLORS = ['#3b82f6', '#22c55e', '#f59e0b'];
const META_DIARIA = {
  contatos: 5,
  atrasosResolvidos: 3,
  followUps: 5
};
export const DashboardHeader = () => {
  const {
    leads,
    metricasDiarias,
    gamificacao
  } = useCRM();
  const ativos = leads.filter(l => l.status !== 'Convertido');
  const atrasados = ativos.filter(l => l.status === 'Atrasado').length;
  const falarHoje = ativos.filter(l => l.status === 'Falar Hoje').length;
  const emDia = ativos.filter(l => l.status === 'Em Dia').length;
  const convertidos = leads.filter(l => l.status === 'Convertido').length;
  const porCadencia = [{
    name: 'Semanal',
    value: leads.filter(l => l.cadencia === 'Semanal').length
  }, {
    name: 'Quinzenal',
    value: leads.filter(l => l.cadencia === 'Quinzenal').length
  }, {
    name: 'Mensal',
    value: leads.filter(l => l.cadencia === 'Mensal').length
  }];

  // Cálculo do progresso diário
  const totalRealizado = metricasDiarias.contatosFeitos + metricasDiarias.atrasosResolvidos + metricasDiarias.leadsQuentesTrabalhados;
  const metaTotal = META_DIARIA.contatos + META_DIARIA.atrasosResolvidos + META_DIARIA.followUps;
  const progressoPercentual = Math.min(totalRealizado / metaTotal * 100, 100);
  const getProgressColor = () => {
    if (progressoPercentual >= 80) return 'bg-status-em-dia';
    if (progressoPercentual >= 50) return 'bg-status-falar-hoje';
    return 'bg-status-atrasado';
  };
  return <div className="space-y-6">
      {/* Barra de Progresso Diária */}
      <div className="bg-card rounded-xl p-6 border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Progresso do Dia</h3>
          </div>
          <span className="text-2xl font-bold text-primary">
            {progressoPercentual.toFixed(0)}%
          </span>
        </div>
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          <div className={`absolute left-0 top-0 h-full transition-all duration-500 rounded-full ${getProgressColor()}`} style={{
          width: `${progressoPercentual}%`
        }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            Contatos: <strong className="text-foreground">{metricasDiarias.contatosFeitos}/{META_DIARIA.contatos}</strong>
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Atrasos resolvidos: <strong className="text-foreground">{metricasDiarias.atrasosResolvidos}/{META_DIARIA.atrasosResolvidos}</strong>
          </span>
          <span className="flex items-center gap-1">
            <Flame className="w-4 h-4" />
            Follow-ups: <strong className="text-foreground">{metricasDiarias.leadsQuentesTrabalhados}/{META_DIARIA.followUps}</strong>
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Total Prospects" value={leads.length} icon={Users} variant="primary" />
        <KPICard title="Atrasados" value={atrasados} icon={AlertTriangle} variant="danger" />
        <KPICard title="Falar Hoje" value={falarHoje} icon={MessageSquare} variant="warning" />
        <KPICard title="Em Dia" value={emDia} icon={CheckCircle} variant="success" />
        <KPICard title="Convertidos" value={convertidos} icon={TrendingUp} variant="success" />
        <KPICard title="Quentes" value={ativos.filter(l => l.temperatura === 'Quente').length} icon={Flame} variant="default" />
      </div>

      {/* Gráfico de Cadência */}
      
    </div>;
};