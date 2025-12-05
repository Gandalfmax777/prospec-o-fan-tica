import { Status, Temperatura, Prioridade } from '@/types/crm';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getStatusClass = () => {
    switch (status) {
      case 'Atrasado':
        return 'status-atrasado';
      case 'Falar Hoje':
        return 'status-falar-hoje';
      case 'Em Dia':
        return 'status-em-dia';
      case 'Convertido':
        return 'bg-primary/10 text-primary border-primary';
      default:
        return '';
    }
  };

  return (
    <span className={cn(
      'metric-badge border font-medium',
      getStatusClass(),
      className
    )}>
      {status}
    </span>
  );
};

interface TemperaturaBadgeProps {
  temperatura: Temperatura;
  className?: string;
}

export const TemperaturaBadge = ({ temperatura, className }: TemperaturaBadgeProps) => {
  const getClass = () => {
    switch (temperatura) {
      case 'Frio':
        return 'temp-frio text-[hsl(var(--temp-frio))]';
      case 'Morno':
        return 'temp-morno text-[hsl(var(--temp-morno))]';
      case 'Quente':
        return 'temp-quente text-[hsl(var(--temp-quente))]';
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (temperatura) {
      case 'Frio':
        return '❄️';
      case 'Morno':
        return '🌤️';
      case 'Quente':
        return '🔥';
      default:
        return '';
    }
  };

  return (
    <span className={cn(
      'metric-badge border font-medium',
      getClass(),
      className
    )}>
      {getIcon()} {temperatura}
    </span>
  );
};

interface PrioridadeBadgeProps {
  prioridade: Prioridade;
  className?: string;
}

export const PrioridadeBadge = ({ prioridade, className }: PrioridadeBadgeProps) => {
  const getClass = () => {
    switch (prioridade) {
      case 'Urgente':
        return 'bg-[hsl(var(--priority-urgent)/0.1)] text-[hsl(var(--priority-urgent))] border-[hsl(var(--priority-urgent))]';
      case 'Alerta':
        return 'bg-[hsl(var(--priority-warning)/0.1)] text-[hsl(var(--priority-warning))] border-[hsl(var(--priority-warning))]';
      case 'Atenção':
        return 'bg-[hsl(var(--priority-attention)/0.1)] text-[hsl(var(--priority-attention))] border-[hsl(var(--priority-attention))]';
      case 'Normal':
        return 'bg-[hsl(var(--priority-normal)/0.1)] text-[hsl(var(--priority-normal))] border-[hsl(var(--priority-normal))]';
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (prioridade) {
      case 'Urgente':
        return '🔴';
      case 'Alerta':
        return '🟠';
      case 'Atenção':
        return '🟡';
      case 'Normal':
        return '🟢';
      default:
        return '';
    }
  };

  return (
    <span className={cn(
      'metric-badge border font-medium',
      getClass(),
      className
    )}>
      {getIcon()} {prioridade}
    </span>
  );
};
