import { formatBRLCompacto } from "@/lib/money";

// Heatmap de vencimentos por mês (CSS grid, sem lib de gráfico).
export function VencimentosHeatmap({ data }: { data: { mes: string; total: number }[] }) {
  const max = data.reduce((m, d) => Math.max(m, d.total), 0);

  const alphaFor = (total: number) => {
    if (total === 0) return 0.06;
    if (max === 0) return 0.06;
    return 0.15 + (total / max) * 0.85;
  };

  const shortLabel = (mes: string) => {
    // Aceita "2026-07", "07/2026" ou rótulos livres — mostra a parte do mês.
    if (mes.includes("-")) return mes.split("-").pop() ?? mes;
    if (mes.includes("/")) return mes.split("/")[0];
    return mes;
  };

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Nenhum vencimento nos próximos meses.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
        {data.map((d, i) => (
          <div
            key={`${d.mes}-${i}`}
            title={`${d.mes}: ${formatBRLCompacto(d.total)}`}
            className="aspect-square rounded-md flex flex-col items-center justify-center border border-border/40"
            style={{ backgroundColor: `hsl(var(--primary) / ${alphaFor(d.total)})` }}
          >
            <span className="text-[10px] font-medium text-foreground/70 leading-none">
              {shortLabel(d.mes)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground">menos</span>
        <div className="flex gap-1">
          {[0.15, 0.35, 0.55, 0.75, 1.0].map((a) => (
            <div
              key={a}
              className="h-3 w-4 rounded-sm border border-border/40"
              style={{ backgroundColor: `hsl(var(--primary) / ${a})` }}
            />
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground">mais</span>
      </div>
    </div>
  );
}
