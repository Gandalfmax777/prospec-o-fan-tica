import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSoWIndicadores } from "@/hooks/sow/useSoW";
import { formatBRLCompacto } from "@/lib/money";
import { VencimentosHeatmap } from "./VencimentosHeatmap";
import { BarChart3 } from "lucide-react";
import {
  Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";

const CHART = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 };

function ChartCard({ title, children, empty }: { title: string; children: React.ReactNode; empty?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {empty ? (
          <p className="text-sm text-muted-foreground py-10 text-center">Sem dados ainda.</p>
        ) : (
          <div className="h-[220px] md:h-[260px]">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function IndicadoresView() {
  const { data, isLoading } = useSoWIndicadores();

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-lg" />)}</div>;
  }
  if (!data) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">Não foi possível carregar os indicadores.</Card>;
  }

  const porInstituicao = [...(data.porInstituicao ?? [])].sort((a, b) => b.total - a.total).slice(0, 8);
  const iv = data.internoVsExterno ?? { interno: 0, externo: 0 };
  const ivData = [
    { name: "Interno (EQI)", value: iv.interno },
    { name: "Externo", value: iv.externo },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Indicadores</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="Distribuição por tipo de ativo" empty={!data.porTipo?.length}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.porTipo} dataKey="total" nameKey="tipo" cx="50%" cy="50%" outerRadius={90} label={(e) => e.tipo}>
                {(data.porTipo ?? []).map((_, i) => <Cell key={i} fill={CHART[i % CHART.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatBRLCompacto(v)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Instituições com maior patrimônio" empty={!porInstituicao.length}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porInstituicao} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => formatBRLCompacto(v)} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis type="category" dataKey="nome" width={90} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatBRLCompacto(v)} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {porInstituicao.map((e, i) => <Cell key={i} fill={e.interna ? "hsl(var(--chart-2))" : "hsl(var(--primary))"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Interno vs Externo" empty={iv.interno === 0 && iv.externo === 0}>
          <div className="flex h-full items-center gap-4">
            <div className="h-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ivData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80}>
                    <Cell fill="hsl(var(--chart-2))" />
                    <Cell fill="hsl(var(--chart-4))" />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatBRLCompacto(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 pr-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Interno (EQI)</p>
                <p className="text-lg font-bold tabular-nums">{formatBRLCompacto(iv.interno)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Externo</p>
                <p className="text-lg font-bold tabular-nums">{formatBRLCompacto(iv.externo)}</p>
              </div>
            </div>
          </div>
        </ChartCard>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Vencimentos por mês</CardTitle></CardHeader>
          <CardContent>
            <VencimentosHeatmap data={data.vencimentosPorMes ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
