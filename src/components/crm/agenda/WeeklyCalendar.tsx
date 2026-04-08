import { useEffect, useRef, useMemo } from "react";
import { format, isSameDay, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WeeklyEventBlock } from "./WeeklyEventBlock";
import type { MemberColorEntry } from "./MemberFilter";
import type { AgendaEvent } from "@/types/crm";

// ─── Constants ───────────────────────────────────────────────────────────────

const START_HOUR = 7;
const END_HOUR = 21;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 44; // px
const TOTAL_SLOTS = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMinutesFromDate(dateStr: string): number {
  const d = new Date(dateStr);
  return d.getHours() * 60 + d.getMinutes();
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

interface PositionedEvent {
  event: AgendaEvent;
  top: number;
  height: number;
  colIndex: number;
  colCount: number;
}

function positionEvents(events: AgendaEvent[]): PositionedEvent[] {
  if (events.length === 0) return [];

  // Calcular top/height para cada evento
  const withPos = events.map((event) => {
    const startMin = event.startDate
      ? getMinutesFromDate(event.startDate)
      : event.date
        ? getMinutesFromDate(event.date)
        : START_HOUR * 60;
    const endMin = event.endDate
      ? getMinutesFromDate(event.endDate)
      : startMin + SLOT_MINUTES;

    const clampedStart = Math.max(startMin, START_HOUR * 60);
    const clampedEnd = Math.min(endMin, END_HOUR * 60);

    const top =
      ((clampedStart - START_HOUR * 60) / SLOT_MINUTES) * SLOT_HEIGHT;
    const height = Math.max(
      SLOT_HEIGHT * 0.8,
      ((clampedEnd - clampedStart) / SLOT_MINUTES) * SLOT_HEIGHT
    );

    return { event, top, height, startMin: clampedStart, endMin: clampedEnd };
  });

  // Ordenar por hora de início
  withPos.sort((a, b) => a.startMin - b.startMin);

  // Agrupar overlaps e atribuir colunas
  const result: PositionedEvent[] = [];
  const groups: (typeof withPos)[] = [];
  let currentGroup: typeof withPos = [];

  for (const item of withPos) {
    if (
      currentGroup.length === 0 ||
      item.startMin < Math.max(...currentGroup.map((g) => g.endMin))
    ) {
      currentGroup.push(item);
    } else {
      groups.push(currentGroup);
      currentGroup = [item];
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);

  for (const group of groups) {
    const colCount = group.length;
    group.forEach((item, colIndex) => {
      result.push({
        event: item.event,
        top: item.top,
        height: item.height,
        colIndex,
        colCount,
      });
    });
  }

  return result;
}

// ─── Components ──────────────────────────────────────────────────────────────

interface WeeklyCalendarProps {
  events: AgendaEvent[];
  weekDays: Date[];
  memberColorMap: Map<string, MemberColorEntry>;
  onSlotClick: (date: Date, startTime: string, endTime: string) => void;
  onEventClick: (event: AgendaEvent) => void;
  visibleDayIndex?: number; // mobile: mostra só esse dia
}

export function WeeklyCalendar({
  events,
  weekDays,
  memberColorMap,
  onSlotClick,
  onEventClick,
  visibleDayIndex,
}: WeeklyCalendarProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  // Scroll para hora atual no mount
  useEffect(() => {
    if (!bodyRef.current) return;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const offset =
      ((currentMinutes - START_HOUR * 60) / SLOT_MINUTES) * SLOT_HEIGHT;
    bodyRef.current.scrollTop = Math.max(0, offset - 100);
  }, []);

  // Agrupar eventos por dia da semana
  const eventsByDay = useMemo(() => {
    const map = new Map<number, AgendaEvent[]>();
    for (const day of weekDays) {
      const dayIndex = weekDays.indexOf(day);
      const dayEvents = events.filter((e) =>
        isSameDay(new Date(e.date), day)
      );
      map.set(dayIndex, dayEvents);
    }
    return map;
  }, [events, weekDays]);

  // Dias visíveis
  const visibleDays =
    visibleDayIndex !== undefined
      ? [{ day: weekDays[visibleDayIndex], index: visibleDayIndex }]
      : weekDays.map((day, index) => ({ day, index }));

  // Time labels
  const timeLabels: string[] = [];
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const minutes = START_HOUR * 60 + i * SLOT_MINUTES;
    if (i % 2 === 0) {
      timeLabels.push(minutesToTime(minutes));
    } else {
      timeLabels.push("");
    }
  }

  // Current time indicator
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const nowOffset =
    ((nowMinutes - START_HOUR * 60) / SLOT_MINUTES) * SLOT_HEIGHT;
  const showNowLine =
    nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60;

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Header — dias da semana */}
      <div className="flex border-b bg-muted/30">
        <div className="w-14 shrink-0" />
        {visibleDays.map(({ day, index }) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={index}
              className={`flex-1 min-w-[100px] text-center py-2 border-l first:border-l-0
                ${isToday ? "bg-primary/5" : ""}`}
            >
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
                {format(day, "EEE", { locale: ptBR })}
              </div>
              <div
                className={`text-sm font-semibold mt-0.5
                  ${isToday ? "text-primary" : "text-foreground"}`}
              >
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Body — grid com scroll */}
      <div
        ref={bodyRef}
        className="overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 260px)", minHeight: "400px" }}
      >
        <div className="flex relative" style={{ height: TOTAL_SLOTS * SLOT_HEIGHT }}>
          {/* Coluna de horários */}
          <div className="w-14 shrink-0">
            {timeLabels.map((label, i) => (
              <div
                key={i}
                className="flex items-start justify-end pr-2"
                style={{ height: SLOT_HEIGHT }}
              >
                {label && (
                  <span className="text-[10px] text-muted-foreground -mt-1.5 select-none">
                    {label}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Colunas dos dias */}
          {visibleDays.map(({ day, index }) => {
            const dayEvents = eventsByDay.get(index) || [];
            const positioned = positionEvents(dayEvents);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={index}
                className={`flex-1 min-w-[100px] border-l relative
                  ${isToday ? "bg-primary/[0.02]" : ""}`}
              >
                {/* Grid lines (slots) */}
                {Array.from({ length: TOTAL_SLOTS }).map((_, slotIdx) => (
                  <div
                    key={slotIdx}
                    className="border-b border-border/40 hover:bg-muted/30 cursor-pointer transition-colors"
                    style={{ height: SLOT_HEIGHT }}
                    onClick={() => {
                      const startMinutes =
                        START_HOUR * 60 + slotIdx * SLOT_MINUTES;
                      const endMinutes = startMinutes + SLOT_MINUTES;
                      onSlotClick(
                        day,
                        minutesToTime(startMinutes),
                        minutesToTime(endMinutes)
                      );
                    }}
                  />
                ))}

                {/* Event blocks */}
                {positioned.map((pos) => {
                  const colorEntry = memberColorMap.get(pos.event.userId);
                  const colorClass = colorEntry
                    ? colorEntry.bg
                    : "bg-primary/10 border-primary/30";

                  const width = `calc(${100 / pos.colCount}% - 2px)`;
                  const left = `calc(${(pos.colIndex * 100) / pos.colCount}% + 1px)`;

                  return (
                    <WeeklyEventBlock
                      key={pos.event.id}
                      event={pos.event}
                      colorClass={colorClass}
                      style={{
                        top: pos.top,
                        height: pos.height,
                        width,
                        left,
                      }}
                      onClick={() => onEventClick(pos.event)}
                    />
                  );
                })}

                {/* Linha "agora" */}
                {showNowLine && isToday && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: nowOffset }}
                  >
                    <div className="flex items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-1 shrink-0" />
                      <div className="h-[2px] bg-red-500 flex-1" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
