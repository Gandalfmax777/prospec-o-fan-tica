import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AgendaEvent } from "@/types/crm";
import {
  Phone,
  Mail,
  Users,
  FileText,
  CheckSquare,
  MapPin,
  Clock,
  Check,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  CALL: { label: "Ligação", icon: Phone, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  EMAIL: { label: "E-mail", icon: Mail, color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  MEETING: { label: "Reunião", icon: Users, color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  NOTE: { label: "Nota", icon: FileText, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  TASK: { label: "Tarefa", icon: CheckSquare, color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  VISIT: { label: "Visita", icon: MapPin, color: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300" },
};

interface AgendaEventCardProps {
  event: AgendaEvent;
  onEdit?: (event: AgendaEvent) => void;
}

export function AgendaEventCard({ event, onEdit }: AgendaEventCardProps) {
  const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.NOTE;
  const Icon = config.icon;

  const timeStr = event.startDate
    ? format(new Date(event.startDate), "HH:mm")
    : format(new Date(event.date), "HH:mm");

  const endTimeStr = event.endDate
    ? format(new Date(event.endDate), "HH:mm")
    : null;

  // Detectar se foi criado pelo CDR
  const isCdrEvent = event.description?.includes("[CDR:");
  const cdrUserName = isCdrEvent
    ? event.description.match(/\[CDR: (.+?)\]/)?.[1]
    : null;

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-accent/50 ${
        event.completed ? "opacity-60" : ""
      }`}
    >
      {/* Ícone do tipo */}
      <div className={`p-2 rounded-md shrink-0 ${config.color}`}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className={`font-medium text-sm truncate ${event.completed ? "line-through" : ""}`}>
            {event.title}
          </span>
          {event.completed && (
            <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
          )}
          {isCdrEvent && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
              CDR
            </Badge>
          )}
        </div>

        {/* Horário */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {timeStr}
            {endTimeStr && ` — ${endTimeStr}`}
          </span>
        </div>

        {/* Participantes */}
        {event.participants && event.participants.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span className="truncate">
              {event.participants.map((p) => p.user.name).join(", ")}
            </span>
          </div>
        )}

        {/* Criador CDR */}
        {cdrUserName && (
          <div className="text-xs text-muted-foreground">
            Criado por {cdrUserName}
          </div>
        )}

        {/* Contato vinculado */}
        {event.contact && (
          <div className="text-xs text-muted-foreground truncate">
            {event.contact.name}
          </div>
        )}
      </div>

      {/* Ação editar */}
      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => onEdit(event)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
