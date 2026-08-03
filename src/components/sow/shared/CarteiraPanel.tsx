import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";

import { useCarteira } from "@/hooks/sow/useCarteira";
import { LABEL_NAO_MAPEADO } from "@/lib/sow/carteira";
import { formatBRLCompacto, formatBRLExato, formatPct } from "@/lib/money";
import { ChartCard } from "./ChartCard";
import { NaoMapeadoHint } from "./NaoMapeadoHint";
import { ProporcaoBar } from "./ProporcaoBar";
import {
  cellProps,
  COR_EXTERNA,
  COR_INTERNA,
  COR_NAO_MAPEADO,
  donutProps,
  PALETA_SEM_VERDE,
  tooltipStyle,
} from "./chartTheme";

const legendProps = {
  iconType: "circle" as const,
  wrapperStyle: { fontSize: 12, color: "hsl(var(--foreground))" },
};

/**
 * Visão de carteira de UM cliente: EQI × externo, alocação por classe, peso por
 * instituição, e a tabela de composição.
 *
 * Componente único do sistema para isso — o CarteirasView do menu lateral e a
 * aba "Carteira" do detalhe do cliente renderizam este mesmo painel.
 */
export function CarteiraPanel({ clienteId }: { clienteId: string }) {
  const { carteira, isLoading } = useCarteira(clienteId);

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[320px] rounded-lg" />
        ))}
      </div>
    );
  }

  const { internoVsExterno, porClasse, porInstituicao, instituicoes, total } = carteira;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard
        title="Na EQI × Externo"
        subtitle={
          total > 0
            ? `Share de ${formatPct(carteira.sharePct, 1)} — ${formatBRLExato(carteira.externo)} fora da casa`
            : undefined
        }
        empty={internoVsExterno.length === 0}
        emptyLabel="Nenhum ativo cadastrado ainda."
      >
        <PieChart>
          <Pie data={internoVsExterno} cx="50%" cy="50%" {...donutProps}>
            {internoVsExterno.map((e) => (
              <Cell
                key={e.name}
                fill={e.name === "Na EQI" ? COR_INTERNA : COR_EXTERNA}
                {...cellProps}
              />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => formatBRLExato(v)} contentStyle={tooltipStyle} />
          <Legend {...legendProps} />
        </PieChart>
      </ChartCard>

      <ChartCard
        title="Alocação por classe"
        subtitle="Classes derivadas do tipo cadastrado em cada ativo"
        empty={porClasse.length === 0}
        emptyLabel="Nenhum ativo cadastrado ainda."
      >
        <PieChart>
          <Pie data={porClasse} cx="50%" cy="50%" {...donutProps}>
            {porClasse.map((e, i) => (
              <Cell
                key={e.name}
                fill={
                  e.name === LABEL_NAO_MAPEADO
                    ? COR_NAO_MAPEADO
                    : PALETA_SEM_VERDE[i % PALETA_SEM_VERDE.length]
                }
                {...cellProps}
              />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => formatBRLExato(v)} contentStyle={tooltipStyle} />
          <Legend {...legendProps} />
        </PieChart>
      </ChartCard>

      <ChartCard
        title="Peso por instituição"
        empty={porInstituicao.length === 0}
        emptyLabel="Nenhum ativo cadastrado ainda — adicione ativos ao cliente para compor a carteira."
      >
        <PieChart>
          <Pie data={porInstituicao} cx="50%" cy="50%" {...donutProps}>
            {porInstituicao.map((c, i) => (
              <Cell
                key={c.name}
                // A fatia da casa sempre em verde, para achar a EQI de relance;
                // as demais numa paleta que não tem verde em nenhum tema.
                fill={c.interna ? COR_INTERNA : PALETA_SEM_VERDE[i % PALETA_SEM_VERDE.length]}
                {...cellProps}
              />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => formatBRLExato(v)} contentStyle={tooltipStyle} />
          <Legend {...legendProps} />
        </PieChart>
      </ChartCard>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Composição</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Instituição</TableHead>
                  <TableHead className="text-right">Patrimônio</TableHead>
                  <TableHead className="text-right">% da carteira</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instituicoes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Nenhuma instituição cadastrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  instituicoes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{c.nome}</span>
                          {c.interna && (
                            <Badge variant="secondary" className="text-[10px]">
                              Da casa
                            </Badge>
                          )}
                        </div>
                        {c.naoMapeado > 0 && (
                          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            {formatBRLCompacto(c.mapeado)} em ativos +{" "}
                            {formatBRLCompacto(c.naoMapeado)} {LABEL_NAO_MAPEADO.toLowerCase()}
                            <NaoMapeadoHint
                              declarado={c.valorInformado ?? 0}
                              mapeado={c.mapeado}
                              naoMapeado={c.naoMapeado}
                            />
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRLExato(c.patrimonio)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="tabular-nums text-sm">{formatPct(c.pct, 1)}</span>
                        <ProporcaoBar
                          pct={c.pct}
                          tone={c.interna ? "interna" : "externa"}
                          className="ml-auto mt-1 w-16"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>

              {instituicoes.length > 0 && (
                <TableFooter>
                  <TableRow className="font-semibold hover:bg-transparent">
                    <TableCell>Patrimônio do cliente</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRLExato(total)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">100%</TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
