import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSoWHistorico, useSoWClientes } from "@/hooks/sow/useSoW";
import { formatBRLCompacto } from "@/lib/money";
import { History } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const CARTEIRA = "__carteira__";

export default function HistoricoView() {
  const [alvo, setAlvo] = useState<string>(CARTEIRA);
  const { data: clientes } = useSoWClientes({});
  const { data, isLoading } = useSoWHistorico(alvo === CARTEIRA ? undefined : alvo, 12);

  const chartData = useMemo(
    () => (data?.pontos ?? []).map((p) => ({ mes: `${String(p.mes).padStart(2, "0")}/${p.ano}`, sharePct: p.sharePct, ...p })),
    [data]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 mr-auto">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Histórico do Share</h2>
        </div>
        <Select value={alvo} onValueChange={setAlvo}>
          <SelectTrigger className="w-[220px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={CARTEIRA}>Carteira (todos os clientes)</SelectItem>
            {(clientes ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-72 rounded-lg" />
      ) : chartData.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Sem histórico ainda.</Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Evolução do Share (%)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[220px] md:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => [`${v.toFixed(1)}%`, "Share"]}
                    />
                    <Line type="monotone" dataKey="sharePct" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Interno</TableHead>
                    <TableHead className="text-right">Externo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.map((p) => (
                    <TableRow key={`${p.ano}-${p.mes}`}>
                      <TableCell>{p.mes}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.sharePct.toFixed(1)}%</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRLCompacto(p.patrimonioTotal)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRLCompacto(p.patrimonioInterno)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRLCompacto(p.patrimonioExterno)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
