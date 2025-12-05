import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'primary';
  className?: string;
}

export const KPICard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  variant = 'default',
  className,
}: KPICardProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'danger':
        return 'border-l-4 border-l-[hsl(var(--status-atrasado))]';
      case 'warning':
        return 'border-l-4 border-l-[hsl(var(--status-falar-hoje))]';
      case 'success':
        return 'border-l-4 border-l-[hsl(var(--status-em-dia))]';
      case 'primary':
        return 'border-l-4 border-l-primary';
      default:
        return '';
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-[hsl(var(--status-atrasado-bg))] text-[hsl(var(--status-atrasado))]';
      case 'warning':
        return 'bg-[hsl(var(--status-falar-hoje-bg))] text-[hsl(var(--status-falar-hoje))]';
      case 'success':
        return 'bg-[hsl(var(--status-em-dia-bg))] text-[hsl(var(--status-em-dia))]';
      case 'primary':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className={cn('kpi-card', getVariantClasses(), className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend !== undefined && (
            <p className={cn(
              'text-sm mt-2 flex items-center gap-1',
              trend >= 0 ? 'text-[hsl(var(--status-em-dia))]' : 'text-[hsl(var(--status-atrasado))]'
            )}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              {trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', getIconBg())}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
