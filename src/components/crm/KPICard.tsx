import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  showIcon?: boolean;
  trend?: number;
  trendLabel?: string;
  variant?: "default" | "danger" | "warning" | "success" | "primary";
  className?: string;
}

export const KPICard = ({
  title,
  value,
  icon: Icon,
  showIcon = true,
  trend,
  trendLabel,
  variant = "default",
  className,
}: KPICardProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "danger":
        return "border-l-4 border-l-destructive";
      case "warning":
        return "border-l-4 border-l-[hsl(var(--warning))]";
      case "success":
        return "border-l-4 border-l-[hsl(var(--success))]";
      case "primary":
        return "border-l-4 border-l-primary";
      default:
        return "";
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case "danger":
        return "bg-destructive/10 text-destructive";
      case "warning":
        return "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]";
      case "success":
        return "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]";
      case "primary":
        return "bg-primary/10 text-primary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card
      className={cn(
        "kpi-card bg-gradient-to-br from-background to-muted/40 border-border/50 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden min-h-[120px] flex flex-col",
        getVariantClasses(),
        className
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2 flex-shrink-0">
        <div className="space-y-1 flex-1 min-w-0">
          <CardDescription className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80 line-clamp-2 break-words">
            {title}
          </CardDescription>
          <p className="text-3xl font-semibold tabular-nums leading-tight break-words">{value}</p>
        </div>
        {showIcon && (
          <div className={cn("p-2.5 rounded-xl flex-shrink-0 shadow-sm transition-transform duration-200 hover:scale-110", getIconBg())}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0 flex-shrink-0">
        {trend !== undefined && (
          <p
            className={cn(
              "text-xs flex items-center gap-1",
              trend >= 0
                ? "text-[hsl(var(--success))]"
                : "text-destructive"
            )}
          >
            {trend >= 0 ? "Up" : "Down"} {Math.abs(trend)}%
            {trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
