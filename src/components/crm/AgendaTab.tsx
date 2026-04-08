import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { AgendaEventDialog } from "./AgendaEventDialog";
import { AgendaViewDialog } from "./AgendaViewDialog";
import { useWeekNavigation } from "./agenda/useWeekNavigation";
import { WeeklyCalendar } from "./agenda/WeeklyCalendar";
import { MemberFilter, buildMemberColorMap } from "./agenda/MemberFilter";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import type { AgendaEvent, TeamMember, TipoEvento } from "@/types/crm";
import {
  Plus,
  CalendarDays,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AgendaTab() {
  const isMobile = useIsMobile();
  const nav = useWeekNavigation();
  const { user } = useAuth();

  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [slotDefaults, setSlotDefaults] = useState<{
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  // View dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingEvent, setViewingEvent] = useState<AgendaEvent | null>(null);

  // CRM settings (horário comercial)
  const [crmStartHour, setCrmStartHour] = useState(7);
  const [crmEndHour, setCrmEndHour] = useState(21);

  // Buscar eventos da semana
  const fetchEvents = useCallback(async () => {
    try {
      setError(null);
      const result = await api.agenda.getEvents(
        nav.weekStart.toISOString(),
        nav.weekEnd.toISOString()
      );
      setEvents(result.activities || []);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao carregar agenda";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [nav.weekStart, nav.weekEnd]);

  // Buscar membros do time (uma vez)
  const fetchTeam = useCallback(async () => {
    try {
      const result = await api.agenda.getTeamMembers();
      const members = result.members || [];
      setTeamMembers(members);
      // Selecionar todos por padrão
      setSelectedMemberIds(members.map((m: TeamMember) => m.userId));
    } catch {
      // Silencioso
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // Buscar configurações do CRM (horário comercial)
  useEffect(() => {
    api.agenda.getSettings().then((settings) => {
      if (settings?.workingHours) {
        const [startH] = settings.workingHours.start.split(":").map(Number);
        const [endH, endM] = settings.workingHours.end.split(":").map(Number);
        if (!isNaN(startH)) setCrmStartHour(startH);
        if (!isNaN(endH)) {
          // Arredondar para cima se tem minutos (ex: 18:30 → 19)
          setCrmEndHour(Math.min(24, endH + (endM > 0 ? 1 : 0)));
        }
      }
    }).catch(() => {});
  }, []);

  // Filtrar eventos por membros selecionados
  const filteredEvents = useMemo(
    () =>
      selectedMemberIds.length === 0
        ? events
        : events.filter((e) => selectedMemberIds.includes(e.userId)),
    [events, selectedMemberIds]
  );

  // Mapa de cores por membro
  const memberColorMap = useMemo(
    () => buildMemberColorMap(teamMembers, selectedMemberIds),
    [teamMembers, selectedMemberIds]
  );

  // Toggle membro
  const handleToggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Dia visível no mobile
  const visibleDayIndex = isMobile
    ? nav.weekDays.findIndex((d) => isSameDay(d, nav.currentDay))
    : undefined;

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleSlotClick = (date: Date, startTime: string, endTime: string) => {
    setSlotDefaults({
      date: format(date, "yyyy-MM-dd"),
      startTime,
      endTime,
    });
    setDialogOpen(true);
  };

  const handleEventClick = (event: AgendaEvent) => {
    setViewingEvent(event);
    setViewDialogOpen(true);
  };

  const handleNewEvent = () => {
    setSlotDefaults(null);
    setDialogOpen(true);
  };

  const handleCreateEvent = async (data: {
    title: string;
    description?: string;
    type: TipoEvento;
    date: string;
    startDate?: string;
    endDate?: string;
    participantEmails?: string[];
    assigneeEmail?: string;
  }) => {
    try {
      setIsPending(true);
      await api.agenda.createEvent(data);
      toast({ title: "Evento criado com sucesso" });
      setDialogOpen(false);
      setSlotDefaults(null);
      await fetchEvents();
    } catch (err) {
      toast({
        title: "Erro ao criar evento",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleUpdateEvent = async (
    id: string,
    data: {
      title: string;
      description?: string;
      type: TipoEvento;
      date: string;
      startDate?: string;
      endDate?: string;
      participantEmails?: string[];
    }
  ) => {
    try {
      setIsPending(true);
      await api.agenda.updateEvent(id, data);
      toast({ title: "Evento atualizado" });
      setViewDialogOpen(false);
      setViewingEvent(null);
      await fetchEvents();
    } catch (err) {
      toast({
        title: "Erro ao atualizar evento",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      setIsPending(true);
      await api.agenda.deleteEvent(id);
      toast({ title: "Evento removido" });
      setViewDialogOpen(false);
      setViewingEvent(null);
      await fetchEvents();
    } catch (err) {
      toast({
        title: "Erro ao remover evento",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  // ─── Error: CRM não configurado ───────────────────────────────────────────

  if (error?.includes("Integração com o CRM não configurada")) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Agenda não disponível</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Para usar a agenda, é necessário configurar a integração com o CRM.
          Peça ao administrador para acessar Configurações → Integração CRM.
        </p>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Agenda</h2>
          <Badge variant="outline" className="text-xs">
            {filteredEvents.length} evento
            {filteredEvents.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {teamMembers.length > 0 && (
            <MemberFilter
              members={teamMembers}
              selectedIds={selectedMemberIds}
              onToggle={handleToggleMember}
              isMobile={isMobile}
            />
          )}
          <Button onClick={handleNewEvent} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={nav.goToToday}
            className="text-xs"
          >
            Hoje
          </Button>
          {isMobile ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={nav.goToPrevDay}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={nav.goToNextDay}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={nav.goToPrevWeek}
                className="text-xs"
              >
                Semana Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nav.goToNextWeek}
                className="text-xs"
              >
                Próxima Semana
              </Button>
            </>
          )}
        </div>

        <span className="text-sm font-medium text-muted-foreground">
          {isMobile
            ? format(nav.currentDay, "EEEE, d 'de' MMMM", { locale: ptBR })
            : `${format(nav.weekStart, "d 'de' MMMM", { locale: ptBR })} — ${format(nav.weekEnd, "d 'de' MMMM", { locale: ptBR })}`}
        </span>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              setLoading(true);
              fetchEvents();
            }}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <WeeklyCalendar
          events={filteredEvents}
          weekDays={nav.weekDays}
          memberColorMap={memberColorMap}
          onSlotClick={handleSlotClick}
          onEventClick={handleEventClick}
          visibleDayIndex={visibleDayIndex}
          startHour={crmStartHour}
          endHour={crmEndHour}
        />
      )}

      {/* Create Dialog */}
      <AgendaEventDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSlotDefaults(null);
        }}
        teamMembers={teamMembers}
        onSave={handleCreateEvent}
        isPending={isPending}
        defaultDate={slotDefaults?.date}
        defaultStartTime={slotDefaults?.startTime}
        defaultEndTime={slotDefaults?.endTime}
      />

      {/* View/Edit Dialog */}
      <AgendaViewDialog
        open={viewDialogOpen}
        onOpenChange={(open) => {
          setViewDialogOpen(open);
          if (!open) setViewingEvent(null);
        }}
        event={viewingEvent}
        currentUserId={user?.id || ""}
        teamMembers={teamMembers}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
        isPending={isPending}
      />
    </div>
  );
}
