import { Phone, Mail, Users, FileText, CheckSquare, MapPin } from "lucide-react";
import type { AgendaEvent, TipoEvento } from "@/types/crm";
import { format } from "date-fns";

const TYPE_CONFIG: Record<TipoEvento, { icon: typeof Phone; label: string }> = {
  CALL: { icon: Phone, label: "Ligação" },
  EMAIL: { icon: Mail, label: "E-mail" },
  MEETING: { icon: Users, label: "Reunião" },
  NOTE: { icon: FileText, label: "Nota" },
  TASK: { icon: CheckSquare, label: "Tarefa" },
  VISIT: { icon: MapPin, label: "Visita" },
};

interface WeeklyEventBlockProps {
  event: AgendaEvent;
  colorClass: string;
  style: React.CSSProperties;
  onClick: () => void;
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  return format(new Date(dateStr), "HH:mm");
}

export function WeeklyEventBlock({
  event,
  colorClass,
  style,
  onClick,
}: WeeklyEventBlockProps) {
  const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.NOTE;
  const Icon = config.icon;
  const startTime = formatTime(event.startDate);
  const endTime = formatTime(event.endDate);
  const timeLabel =
    startTime && endTime
      ? `${startTime} – ${endTime}`
      : startTime || formatTime(event.date);

  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={`absolute inset-x-0.5 rounded-md border px-1.5 py-0.5 text-left cursor-pointer
        overflow-hidden transition-opacity hover:opacity-90 z-10
        ${colorClass}
        ${event.completed ? "opacity-50 line-through" : ""}`}
    >
      <div className="flex items-center gap-1 min-w-0">
        <Icon className="h-3 w-3 shrink-0 opacity-70" />
        <span className="text-[10px] font-medium truncate leading-tight">
          {event.title}
        </span>
      </div>
      {timeLabel && (
        <span className="text-[9px] opacity-60 leading-tight block">
          {timeLabel}
        </span>
      )}
    </button>
  );
}
