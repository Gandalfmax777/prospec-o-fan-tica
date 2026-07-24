import { cn } from "@/lib/utils";

/** Barra de share atual vs meta. value/meta em % (0-100). */
export function ShareBar({
  value,
  meta,
  className,
  showLabel = true,
}: {
  value: number;
  meta?: number;
  className?: string;
  showLabel?: boolean;
}) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  const m = meta == null ? null : Math.max(0, Math.min(100, meta));
  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="font-semibold text-foreground tabular-nums">{v.toFixed(0)}%</span>
          {m != null && <span className="text-muted-foreground tabular-nums">meta {m.toFixed(0)}%</span>}
        </div>
      )}
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all" style={{ width: `${v}%` }} />
        {m != null && (
          <div
            className="absolute inset-y-0 w-[2px] bg-foreground/50"
            style={{ left: `calc(${m}% - 1px)` }}
            title={`Meta ${m}%`}
          />
        )}
      </div>
    </div>
  );
}
