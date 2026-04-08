import { Clock, Users } from "lucide-react";
import type { AgendaEvent } from "@/types/crm";
import { format } from "date-fns";

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
  const startTime = formatTime(event.startDate);
  const endTime = formatTime(event.endDate);
  const timeLabel =
    startTime && endTime
      ? `${startTime} - ${endTime}`
      : startTime || formatTime(event.date);

  // Calculate duration in hours
  const durationHours =
    event.startDate && event.endDate
      ? (new Date(event.endDate).getTime() -
          new Date(event.startDate).getTime()) /
        (1000 * 60 * 60)
      : 0.5;
  const durationLabel = durationHours
    .toFixed(1)
    .replace(".0", "");

  // Compact mode when block is small (< 56px matches CRM threshold)
  const heightPx = typeof style.height === "number" ? style.height : 44;
  const isCompact = heightPx <= 56;

  // Detect CDR-created events
  const isCdrEvent = event.description?.includes("[CDR:");

  // Has participants
  const hasParticipants =
    event.participants && event.participants.length > 0;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={style}
      className={`rounded border border-border/70 p-2 text-xs group overflow-hidden
        cursor-pointer transition-all duration-150 text-left
        hover:border-primary/35 hover:shadow-md
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35
        ${colorClass || "bg-card"}
        ${event.completed ? "opacity-50" : ""}`}
    >
      {/* Inner content — matches CRM TimeSpanCard */}
      <div className="h-full min-h-0 flex flex-col justify-between items-start text-foreground">
        <div className="w-full flex flex-col gap-0.5 min-w-0">
          {/* Time range — always visible */}
          <p className="text-[11px] font-semibold leading-tight whitespace-nowrap">
            {timeLabel}
          </p>

          {/* Title */}
          {!isCompact ? (
            <p className="text-[11px] font-medium leading-tight line-clamp-1 flex items-center gap-1 min-w-0">
              {hasParticipants && (
                <Users className="h-2.5 w-2.5 shrink-0" />
              )}
              <span className="truncate">{event.title}</span>
            </p>
          ) : (
            <p className="text-[10px] leading-tight truncate font-medium">
              {event.title}
            </p>
          )}
        </div>

        {/* Footer */}
        {!isCompact ? (
          <div className="w-full flex items-center justify-between gap-2 min-w-0 mt-auto">
            <div className="flex items-center gap-1 text-[10px] text-foreground/85 whitespace-nowrap">
              <Clock className="h-2 w-2" />
              <span>{durationLabel}h</span>
            </div>
            {isCdrEvent && (
              <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 leading-none">
                CDR
              </span>
            )}
          </div>
        ) : (
          <div className="w-full flex items-center justify-end whitespace-nowrap">
            <p className="text-[10px] leading-tight text-foreground/85">
              {endTime}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}
