import { useState, useEffect, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { AgendaEventCard } from "./AgendaEventCard";
import { AgendaEventDialog } from "./AgendaEventDialog";
import type { AgendaEvent, TeamMember, TipoEvento } from "@/types/crm";
import {
  Plus,
  CalendarDays,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export function AgendaTab() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Buscar eventos do mês
  const fetchEvents = useCallback(async () => {
    try {
      setError(null);
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const result = await api.agenda.getEvents(
        start.toISOString(),
        end.toISOString()
      );

      setEvents(result.activities || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar agenda";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  // Buscar membros do time (uma vez)
  const fetchTeam = useCallback(async () => {
    try {
      const result = await api.agenda.getTeamMembers();
      setTeamMembers(result.members || []);
    } catch {
      // Silencioso — team members é opcional
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // Eventos do dia selecionado
  const eventsForDay = events.filter((e) =>
    isSameDay(new Date(e.date), selectedDate)
  );

  // Dias com eventos (para marcadores no calendário)
  const daysWithEvents = new Set(
    events.map((e) => format(new Date(e.date), "yyyy-MM-dd"))
  );

  // Handlers
  const handleCreateEvent = async (data: {
    title: string;
    description?: string;
    type: TipoEvento;
    date: string;
    startDate?: string;
    endDate?: string;
    participantEmails?: string[];
  }) => {
    try {
      setIsPending(true);
      await api.agenda.createEvent(data);
      toast({ title: "Evento criado com sucesso" });
      setDialogOpen(false);
      setEditingEvent(null);
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

  const handleUpdateEvent = async (data: {
    title: string;
    description?: string;
    type: TipoEvento;
    date: string;
    startDate?: string;
    endDate?: string;
    participantEmails?: string[];
  }) => {
    if (!editingEvent) return;

    try {
      setIsPending(true);
      await api.agenda.updateEvent(editingEvent.id, data);
      toast({ title: "Evento atualizado" });
      setDialogOpen(false);
      setEditingEvent(null);
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
      setDialogOpen(false);
      setEditingEvent(null);
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

  const handleEditEvent = (event: AgendaEvent) => {
    setEditingEvent(event);
    setDialogOpen(true);
  };

  const handleNewEvent = () => {
    setEditingEvent(null);
    setDialogOpen(true);
  };

  // Erro: CRM não configurado
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Agenda</h2>
          <Badge variant="outline" className="text-xs">
            {events.length} evento{events.length !== 1 ? "s" : ""} no mês
          </Badge>
        </div>
        <Button onClick={handleNewEvent} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Novo Evento
        </Button>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Coluna esquerda: Calendário */}
        <div className="space-y-4">
          {/* Navegação do mês */}
          <div className="flex items-center justify-between px-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(day) => day && setSelectedDate(day)}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            locale={ptBR}
            modifiers={{
              hasEvent: (date) =>
                daysWithEvents.has(format(date, "yyyy-MM-dd")),
            }}
            modifiersClassNames={{
              hasEvent:
                "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary relative",
            }}
            className="rounded-md border"
          />

          {/* Resumo rápido */}
          <div className="rounded-md border p-3 space-y-2">
            <h4 className="text-sm font-medium">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h4>
            <p className="text-xs text-muted-foreground">
              {eventsForDay.length === 0
                ? "Nenhum evento agendado"
                : `${eventsForDay.length} evento${eventsForDay.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Coluna direita: Lista de eventos do dia */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Eventos — {format(selectedDate, "dd/MM/yyyy")}
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-8 text-center">
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
          ) : eventsForDay.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-3">
                Nenhum evento neste dia
              </p>
              <Button variant="outline" size="sm" onClick={handleNewEvent}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Criar evento
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {eventsForDay
                .sort((a, b) => {
                  const dateA = a.startDate || a.date;
                  const dateB = b.startDate || b.date;
                  return new Date(dateA).getTime() - new Date(dateB).getTime();
                })
                .map((event) => (
                  <AgendaEventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEditEvent}
                  />
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      <AgendaEventDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingEvent(null);
        }}
        event={editingEvent}
        teamMembers={teamMembers}
        onSave={editingEvent ? handleUpdateEvent : handleCreateEvent}
        onDelete={editingEvent ? handleDeleteEvent : undefined}
        isPending={isPending}
      />
    </div>
  );
}
