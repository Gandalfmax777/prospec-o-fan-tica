import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSoW } from "@/context/SoWContext";
import {
  useSoWClientes,
  useSoWInstituicoes,
  useSoWAtivosCliente,
} from "@/hooks/sow/useSoW";
import { formatBRLCompacto } from "@/lib/money";
import { ArrowLeft, Wallet } from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function CarteiraCliente({ clienteId }: { clienteId: string }) {
  const { data: instituicoes, isLoading: loadingInst } = useSoWInstituicoes(clienteId);
  const { data: ativos, isLoading: loadingAtivos } = useSoWAtivosCliente(clienteId);

  const composicao = useMemo(() => {
    const insts = instituicoes ?? [];
    const list = ativos ?? [];
    return insts
      .map((inst) => {
        const total = list
          .filter((a) => a.instituicaoId === inst.id)
          .reduce((acc, a) => acc + (a.valorAplicado ?? 0), 0);
        return { name: inst.nome, value: total, interna: inst.interna };
      })
      .sort((a, b) => b.value - a.value);
  }, [instituicoes, ativos]);

  const comValor = composicao.filter((c) => c.value > 0);
  const total = composicao.reduce((acc, c) => acc + c.value, 0);

  if (loadingInst || loadingAtivos) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[320px] rounded-lg" />
        <Skeleton className="h-[320px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Composição por instituição</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {comValor.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Sem ativos com valor para compor a carteira.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={comValor}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {comValor.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatBRLCompacto(v)}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: "hsl(var(--foreground))" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Instituições</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Instituição</TableHead>
                  <TableHead className="text-right">Total aplicado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {composicao.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhuma instituição cadastrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {composicao.map((c) => (
                      <TableRow key={c.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{c.name}</span>
                            {c.interna && (
                              <Badge variant="secondary" className="text-[10px]">
                                Interna
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatBRLCompacto(c.value)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t border-border font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRLCompacto(total)}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CarteirasView() {
  const { selectedClienteId, setSelectedClienteId, scope } = useSoW();
  const { data, isLoading } = useSoWClientes({ scope: scope || undefined });

  const clienteNome = useMemo(
    () => (data ?? []).find((c) => c.id === selectedClienteId)?.nome ?? "",
    [data, selectedClienteId]
  );

  if (selectedClienteId) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedClienteId(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Trocar cliente
          </Button>
          <h2 className="text-xl font-bold text-foreground">
            Carteira{clienteNome ? ` · ${clienteNome}` : ""}
          </h2>
        </div>
        <CarteiraCliente clienteId={selectedClienteId} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Carteiras</h2>
      </div>

      {isLoading ? (
        <Skeleton className="h-10 w-[280px] rounded-md" />
      ) : (
        <div className="max-w-sm">
          <Select onValueChange={(v) => setSelectedClienteId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {(data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Selecione um cliente para ver a composição da carteira.
      </p>
    </div>
  );
}
