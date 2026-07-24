import { cn } from "@/lib/utils";
import type { SoWUrgencia } from "@/types/sow";

const tones: Record<SoWUrgencia, string> = {
  Alta: "bg-destructive/10 text-destructive",
  Média: "bg-[hsl(38_92%_50%/0.12)] text-[hsl(38_92%_40%)]",
  Baixa: "bg-muted text-muted-foreground",
};

export function UrgenciaBadge({ urgencia, className }: { urgencia: SoWUrgencia; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold", tones[urgencia] ?? tones.Baixa, className)}>
      {urgencia}
    </span>
  );
}
