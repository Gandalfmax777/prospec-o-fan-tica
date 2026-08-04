import { ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Card de gráfico com altura fixa e estado vazio. Estava duplicado em
 * CarteirasView e IndicadoresView.
 */
export function ChartCard({
  title,
  subtitle,
  children,
  empty,
  emptyLabel = "Sem dados ainda.",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  empty?: boolean;
  emptyLabel?: string;
}) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent className="h-[300px]">
        {empty ? (
          <p className="py-16 text-center text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
