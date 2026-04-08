import { useState, useMemo, useCallback } from "react";
import {
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export function useWeekNavigation() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentDay, setCurrentDay] = useState(new Date());

  const weekStart = useMemo(
    () => startOfWeek(currentWeek, { locale: ptBR }),
    [currentWeek]
  );
  const weekEnd = useMemo(
    () => endOfWeek(currentWeek, { locale: ptBR }),
    [currentWeek]
  );
  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd]
  );

  const goToPrevWeek = useCallback(
    () => setCurrentWeek((w) => subWeeks(w, 1)),
    []
  );
  const goToNextWeek = useCallback(
    () => setCurrentWeek((w) => addWeeks(w, 1)),
    []
  );

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentWeek(today);
    setCurrentDay(today);
  }, []);

  const goToPrevDay = useCallback(() => {
    setCurrentDay((d) => {
      const newDay = subDays(d, 1);
      const newWeekStart = startOfWeek(newDay, { locale: ptBR });
      const curWeekStart = startOfWeek(d, { locale: ptBR });
      if (newWeekStart.getTime() !== curWeekStart.getTime()) {
        setCurrentWeek(newWeekStart);
      }
      return newDay;
    });
  }, []);

  const goToNextDay = useCallback(() => {
    setCurrentDay((d) => {
      const newDay = addDays(d, 1);
      const newWeekStart = startOfWeek(newDay, { locale: ptBR });
      const curWeekStart = startOfWeek(d, { locale: ptBR });
      if (newWeekStart.getTime() !== curWeekStart.getTime()) {
        setCurrentWeek(newWeekStart);
      }
      return newDay;
    });
  }, []);

  return {
    currentWeek,
    currentDay,
    weekStart,
    weekEnd,
    weekDays,
    goToPrevWeek,
    goToNextWeek,
    goToToday,
    goToPrevDay,
    goToNextDay,
  };
}
