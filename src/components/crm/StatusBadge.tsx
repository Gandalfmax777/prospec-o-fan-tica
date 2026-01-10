import { Status, Temperatura, Prioridade } from "@/types/crm";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getStatusVariant = () => {
    switch (status) {
      case "Atrasado":
        return "status-atrasado";
      case "Falar Hoje":
        return "status-falar-hoje";
      case "Em Dia":
        return "status-em-dia";
      case "Convertido":
        return "bg-primary/10 text-primary border-primary hover:bg-primary/20";
      default:
        return "";
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn(getStatusVariant(), className)}
    >
      {status}
    </Badge>
  );
};

interface TemperaturaBadgeProps {
  temperatura: Temperatura;
  className?: string;
}

export const TemperaturaBadge = ({ temperatura, className }: TemperaturaBadgeProps) => {
  const getTemperaturaClass = () => {
    switch (temperatura) {
      case "Frio":
        return "temp-frio text-[hsl(var(--temp-frio))]";
      case "Morno":
        return "temp-morno text-[hsl(var(--temp-morno))]";
      case "Quente":
        return "temp-quente text-[hsl(var(--temp-quente))]";
      default:
        return "";
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn(getTemperaturaClass(), className)}
    >
      {temperatura}
    </Badge>
  );
};

interface PrioridadeBadgeProps {
  prioridade: Prioridade;
  className?: string;
}

export const PrioridadeBadge = ({ prioridade, className }: PrioridadeBadgeProps) => {
  const getPrioridadeClass = () => {
    switch (prioridade) {
      case "Urgente":
        return "bg-[hsl(var(--priority-urgent)/0.1)] text-[hsl(var(--priority-urgent))] border-[hsl(var(--priority-urgent))] hover:bg-[hsl(var(--priority-urgent)/0.2)]";
      case "Alerta":
        return "bg-[hsl(var(--priority-warning)/0.1)] text-[hsl(var(--priority-warning))] border-[hsl(var(--priority-warning))] hover:bg-[hsl(var(--priority-warning)/0.2)]";
      case "Atenção":
        return "bg-[hsl(var(--priority-attention)/0.1)] text-[hsl(var(--priority-attention))] border-[hsl(var(--priority-attention))] hover:bg-[hsl(var(--priority-attention)/0.2)]";
      case "Normal":
        return "bg-[hsl(var(--priority-normal)/0.1)] text-[hsl(var(--priority-normal))] border-[hsl(var(--priority-normal))] hover:bg-[hsl(var(--priority-normal)/0.2)]";
      default:
        return "";
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn(getPrioridadeClass(), className)}
    >
      {prioridade}
    </Badge>
  );
};
