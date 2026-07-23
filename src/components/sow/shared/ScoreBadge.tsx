import { cn } from "@/lib/utils";

/** Badge de score de potencial (0-100). */
export function ScoreBadge({ score, className }: { score: number | null | undefined; className?: string }) {
  if (score == null) {
    return (
      <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-muted text-muted-foreground", className)}>
        —
      </span>
    );
  }
  const s = Math.round(score);
  const tone =
    s >= 75
      ? "bg-[hsl(142_71%_42%/0.12)] text-[hsl(142_71%_36%)] dark:text-[hsl(142_71%_55%)]"
      : s >= 50
      ? "bg-primary/10 text-primary"
      : s >= 25
      ? "bg-[hsl(38_92%_50%/0.12)] text-[hsl(38_92%_40%)]"
      : "bg-destructive/10 text-destructive";
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums", tone, className)}>
      {s}
    </span>
  );
}
