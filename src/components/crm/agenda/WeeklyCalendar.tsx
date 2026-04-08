import { useEffect, useRef, useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WeeklyEventBlock } from "./WeeklyEventBlock";
import type { MemberColorEntry } from "./MemberFilter";
import type { AgendaEvent } from "@/types/crm";

// ─── Constants (match CRM availability.tsx) ──────────────────────────────────

const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 21;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 44; // px — same as CRM slotHeight={44}

const DAYS_PT = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

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

function positionEvents(events: AgendaEvent[], startHour: number, endHour: number): PositionedEvent[] {
  if (events.length === 0) return [];

  const withPos = events.map((event) => {
    const startMin = event.startDate
      ? getMinutesFromDate(event.startDate)
      : event.date
        ? getMinutesFromDate(event.date)
        : startHour * 60;
    const endMin = event.endDate
      ? getMinutesFromDate(event.endDate)
      : startMin + SLOT_MINUTES;

    const clampedStart = Math.max(startMin, startHour * 60);
    const clampedEnd = Math.min(endMin, endHour * 60);

    const top =
      ((clampedStart - startHour * 60) / SLOT_MINUTES) * SLOT_HEIGHT;
    const height = Math.max(
      SLOT_HEIGHT * 0.8,
      ((clampedEnd - clampedStart) / SLOT_MINUTES) * SLOT_HEIGHT
    );

    return { event, top, height, startMin: clampedStart, endMin: clampedEnd };
  });

  withPos.sort((a, b) => a.startMin - b.startMin);

  // Group overlaps
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

// ─── Component ───────────────────────────────────────────────────────────────

interface WeeklyCalendarProps {
  events: AgendaEvent[];
  weekDays: Date[];
  memberColorMap: Map<string, MemberColorEntry>;
  onSlotClick: (date: Date, startTime: string, endTime: string) => void;
  onEventClick: (event: AgendaEvent) => void;
  visibleDayIndex?: number;
  startHour?: number;
  endHour?: number;
}

export function WeeklyCalendar({
  events,
  weekDays,
  memberColorMap,
  onSlotClick,
  onEventClick,
  visibleDayIndex,
  startHour = DEFAULT_START_HOUR,
  endHour = DEFAULT_END_HOUR,
}: WeeklyCalendarProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const TOTAL_SLOTS = ((endHour - startHour) * 60) / SLOT_MINUTES;

  // Scroll to current time on mount
  useEffect(() => {
    if (!bodyRef.current) return;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const offset =
      ((currentMinutes - startHour * 60) / SLOT_MINUTES) * SLOT_HEIGHT;
    bodyRef.current.scrollTop = Math.max(0, offset - 120);
  }, [startHour]);

  // Group events by day index
  const eventsByDay = useMemo(() => {
    const map = new Map<number, AgendaEvent[]>();
    for (let i = 0; i < weekDays.length; i++) {
      const dayEvents = events.filter((e) =>
        isSameDay(new Date(e.date), weekDays[i])
      );
      map.set(i, dayEvents);
    }
    return map;
  }, [events, weekDays]);

  // Visible days
  const visibleDays =
    visibleDayIndex !== undefined
      ? [{ day: weekDays[visibleDayIndex], index: visibleDayIndex }]
      : weekDays.map((day, index) => ({ day, index }));

  // Current time indicator
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const nowOffset =
    ((nowMinutes - startHour * 60) / SLOT_MINUTES) * SLOT_HEIGHT;
  const showNowLine =
    nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60;

  return (
    <div
      className="flex w-full flex-col overflow-hidden rounded-md border border-border/60 bg-background shadow-sm select-none"
      style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}
    >
      {/* ── Header — matches CRM availability.tsx layout ── */}
      <div className="flex w-full border-b border-border bg-muted">
        {/* Time spacer */}
        <div className="w-16 shrink-0 bg-muted p-2 text-xs font-medium text-muted-foreground" />
        {/* Day headers */}
        <div
          className="flex flex-1"
          style={{ borderLeft: "1px solid hsl(var(--border))" }}
        >
          {visibleDays.map(({ day, index }) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={index}
                className={`flex-1 min-w-[100px] border-r border-border px-2 py-3 text-center last:border-r-0
                  ${isToday ? "text-primary font-semibold" : "text-foreground"}`}
              >
                <div className="text-sm font-medium">
                  {DAYS_PT[day.getDay()]}
                </div>
                <div
                  className={`text-xs mt-0.5
                    ${isToday ? "text-primary" : "text-muted-foreground"}`}
                >
                  {format(day, "d MMM", { locale: ptBR })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Body — scrollable grid ── */}
      <div
        ref={bodyRef}
        className="relative flex flex-1 overflow-y-auto"
      >
        {/* Time Labels column */}
        <div className="relative z-30 w-16 shrink-0 flex flex-col">
          {Array.from({ length: TOTAL_SLOTS }).map((_, i) => {
            const totalMinutes = startHour * 60 + i * SLOT_MINUTES;
            const hour = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return (
              <div
                key={`${hour}-${minutes}`}
                style={{
                  height: `${SLOT_HEIGHT}px`,
                  backgroundColor: "hsl(var(--muted))",
                }}
                className="shrink-0 border-b border-dashed border-border relative flex items-center justify-start pl-3"
              >
                <span className="text-xs text-muted-foreground">
                  {minutesToTime(totalMinutes)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Days Grid */}
        <div
          className="flex flex-1 relative overflow-hidden bg-background dark:bg-card"
          style={{
            minHeight: `${TOTAL_SLOTS * SLOT_HEIGHT}px`,
            borderLeft: "1px solid hsl(var(--border))",
          }}
        >
          {/* Horizontal grid lines */}
          <div className="absolute inset-0 pointer-events-none flex flex-col">
            {Array.from({ length: TOTAL_SLOTS }).map((_, i) => (
              <div
                key={i}
                style={{ height: `${SLOT_HEIGHT}px` }}
                className="border-b border-dashed border-border w-full"
              />
            ))}
          </div>

          {/* Day Columns */}
          {visibleDays.map(({ day, index }) => {
            const dayEvents = eventsByDay.get(index) || [];
            const positioned = positionEvents(dayEvents, startHour, endHour);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={index}
                className="flex-1 relative border-r border-border last:border-r-0 min-w-[100px]"
              >
                {/* Hoverable time slots — same as CRM */}
                <div className="absolute inset-0 flex flex-col z-0 pointer-events-auto cursor-cell">
                  {Array.from({ length: TOTAL_SLOTS }).map((_, slotIdx) => (
                    <div
                      key={slotIdx}
                      style={{ height: `${SLOT_HEIGHT}px` }}
                      className="w-full pointer-events-auto cursor-cell transition-all duration-150
                        hover:bg-primary/25 dark:hover:bg-primary/30
                        hover:shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.45)]"
                      onClick={() => {
                        const startMinutes =
                          startHour * 60 + slotIdx * SLOT_MINUTES;
                        const endMinutes = startMinutes + SLOT_MINUTES;
                        onSlotClick(
                          day,
                          minutesToTime(startMinutes),
                          minutesToTime(endMinutes)
                        );
                      }}
                    />
                  ))}
                </div>

                {/* Event blocks */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {positioned.map((pos) => {
                    const colorEntry = memberColorMap.get(pos.event.userId);
                    const colorClass = colorEntry
                      ? colorEntry.bg
                      : "bg-primary/10 border-primary/30";

                    const width =
                      pos.colCount > 1
                        ? `calc(${100 / pos.colCount}% - 4px)`
                        : "calc(100% - 4px)";
                    const left =
                      pos.colCount > 1
                        ? `calc(${(pos.colIndex * 100) / pos.colCount}% + 2px)`
                        : "2px";

                    return (
                      <WeeklyEventBlock
                        key={pos.event.id}
                        event={pos.event}
                        colorClass={colorClass}
                        style={{
                          position: "absolute",
                          top: pos.top,
                          height: pos.height,
                          width,
                          left,
                          pointerEvents: "auto",
                        }}
                        onClick={() => onEventClick(pos.event)}
                      />
                    );
                  })}
                </div>

                {/* Current time indicator */}
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
