import { cn } from "@/lib/utils";

/**
 * Barrinha de proporção inline, para ler a fatia sem precisar comparar números.
 *
 * Verde = da casa (EQI), cinza = externo — mas a cor é REFORÇO, nunca o único
 * sinal: o tema por tenant remapeia `--chart-*` e no tema EQI metade da paleta
 * é verde. Quem diz "da casa" é o rótulo ao lado, não a barra.
 */
export function ProporcaoBar({
  pct,
  tone = "externa",
  className,
}: {
  pct: number;
  tone?: "interna" | "externa";
  className?: string;
}) {
  // `formatPct` já devolve "0%" para NaN, mas `width: NaN%` não é protegido em
  // lugar nenhum — e um ativo de valor zero numa carteira zerada chega aqui.
  const seguro = Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0;

  return (
    <div
      className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}
      role="presentation"
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width]",
          tone === "interna" ? "bg-[hsl(var(--chart-2))]" : "bg-muted-foreground/40"
        )}
        style={{ width: `${seguro}%` }}
      />
    </div>
  );
}
