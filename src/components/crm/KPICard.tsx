import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

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

const variantConfig = {
  default: {
    iconBg: "bg-muted text-muted-foreground",
    valuColor: "text-foreground",
    accentLine: "bg-border",
  },
  danger: {
    iconBg: "bg-destructive/10 text-destructive",
    valuColor: "text-foreground",
    accentLine: "bg-destructive",
  },
  warning: {
    iconBg: "bg-[hsl(38_92%_50%/0.1)] text-[hsl(38_92%_46%)]",
    valuColor: "text-foreground",
    accentLine: "bg-[hsl(38_92%_50%)]",
  },
  success: {
    iconBg: "bg-[hsl(142_71%_42%/0.1)] text-[hsl(142_71%_36%)] dark:text-[hsl(142_71%_55%)]",
    valuColor: "text-foreground",
    accentLine: "bg-[hsl(142_71%_42%)]",
  },
  primary: {
    iconBg: "bg-primary/10 text-primary",
    valuColor: "text-foreground",
    accentLine: "bg-primary",
  },
};

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
  const config = variantConfig[variant];

  return (
    <div
      className={cn(
        "relative bg-card rounded-lg border border-border p-4 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group",
        className
      )}
    >
      {/* Accent line at top */}
      <div className={cn("absolute top-0 left-4 right-4 h-[2px] rounded-b-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300", config.accentLine)} />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2.5 flex-1 min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground truncate">
            {title}
          </p>
          <p
            className={cn(
              "text-[26px] leading-none font-bold tabular-nums truncate",
              config.valuColor
            )}
            style={{ letterSpacing: "-0.03em" }}
          >
            {value}
          </p>
          {trend !== undefined && (
            <p
              className={cn(
                "text-[11px] flex items-center gap-1 font-medium",
                trend >= 0
                  ? "text-[hsl(142_71%_42%)] dark:text-[hsl(142_71%_55%)]"
                  : "text-destructive"
              )}
            >
              <span>{trend >= 0 ? "↑" : "↓"}</span>
              {Math.abs(trend)}%
              {trendLabel && (
                <span className="text-muted-foreground font-normal ml-0.5">{trendLabel}</span>
              )}
            </p>
          )}
        </div>

        {showIcon && (
          <div
            className={cn(
              "p-2 rounded-lg shrink-0 transition-transform duration-200 group-hover:scale-105",
              config.iconBg
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
};
