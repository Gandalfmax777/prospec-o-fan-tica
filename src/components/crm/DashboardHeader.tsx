import { useCRM } from '@/context/CRMContext';
import { KPICard } from './KPICard';
import { Users, AlertTriangle, MessageSquare, CheckCircle, TrendingUp, Flame } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b'];

export const DashboardHeader = () => {
  const { leads } = useCRM();

  const ativos = leads.filter(l => l.status !== 'Convertido');
  const atrasados = ativos.filter(l => l.status === 'Atrasado').length;
  const falarHoje = ativos.filter(l => l.status === 'Falar Hoje').length;
  const emDia = ativos.filter(l => l.status === 'Em Dia').length;
  const convertidos = leads.filter(l => l.status === 'Convertido').length;

  const porCadencia = [
    { name: 'Semanal', value: leads.filter(l => l.cadencia === 'Semanal').length },
    { name: 'Quinzenal', value: leads.filter(l => l.cadencia === 'Quinzenal').length },
    { name: 'Mensal', value: leads.filter(l => l.cadencia === 'Mensal').length },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Total Prospects"
          value={leads.length}
          icon={Users}
          variant="primary"
        />
        <KPICard
          title="Atrasados"
          value={atrasados}
          icon={AlertTriangle}
          variant="danger"
        />
        <KPICard
          title="Falar Hoje"
          value={falarHoje}
          icon={MessageSquare}
          variant="warning"
        />
        <KPICard
          title="Em Dia"
          value={emDia}
          icon={CheckCircle}
          variant="success"
        />
        <KPICard
          title="Convertidos"
          value={convertidos}
          icon={TrendingUp}
          variant="success"
        />
        <KPICard
          title="Quentes"
          value={ativos.filter(l => l.temperatura === 'Quente').length}
          icon={Flame}
          variant="default"
        />
      </div>

      {/* Gráfico de Cadência */}
      <div className="bg-card rounded-xl p-6 border">
        <h3 className="font-semibold mb-4">Distribuição por Cadência</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={porCadencia}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {porCadencia.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
