import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { AgendaEvent, TeamMember, TipoEvento } from "@/types/crm";
import { X } from "lucide-react";

const EVENT_TYPES: { value: TipoEvento; label: string }[] = [
  { value: "CALL", label: "Ligação" },
  { value: "EMAIL", label: "E-mail" },
  { value: "MEETING", label: "Reunião" },
  { value: "TASK", label: "Tarefa" },
  { value: "VISIT", label: "Visita" },
];

interface AgendaEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: AgendaEvent | null;
  teamMembers: TeamMember[];
  onSave: (data: {
    title: string;
    description?: string;
    type: TipoEvento;
    date: string;
    startDate?: string;
    endDate?: string;
    participantEmails?: string[];
  }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isPending?: boolean;
  /** Pré-preencher data ao criar via click no slot */
  defaultDate?: string;
  /** Pré-preencher hora início ao criar via click no slot */
  defaultStartTime?: string;
  /** Pré-preencher hora fim ao criar via click no slot */
  defaultEndTime?: string;
}

export function AgendaEventDialog({
  open,
  onOpenChange,
  event,
  teamMembers,
  onSave,
  onDelete,
  isPending = false,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
}: AgendaEventDialogProps) {
  const isEditing = !!event;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TipoEvento>("MEETING");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  // Reset form quando abre/fecha ou muda o event
  useEffect(() => {
    if (open) {
      if (event) {
        setTitle(event.title);
        // Remover metadata CDR da description pro form
        const cleanDesc = (event.description || "")
          .replace(/\[CDR: .+?\]\s*/g, "")
          .replace(/\[cdrUserId: .+?\]\s*/g, "")
          .trim();
        setDescription(cleanDesc);
        setType(event.type);
        setDate(event.date ? new Date(event.date).toISOString().split("T")[0] : "");
        setStartTime(
          event.startDate
            ? new Date(event.startDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
            : "09:00"
        );
        setEndTime(
          event.endDate
            ? new Date(event.endDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
            : "10:00"
        );
        setSelectedEmails(
          event.participants?.map((p) => p.user.email) || []
        );
      } else {
        setTitle("");
        setDescription("");
        setType("MEETING");
        setDate(defaultDate || new Date().toISOString().split("T")[0]);
        setStartTime(defaultStartTime || "09:00");
        setEndTime(defaultEndTime || "10:00");
        // Pré-selecionar leaders por padrão
        const leaderEmails = teamMembers
          .filter((m) => m.role === "OWNER" || m.role === "ADMIN")
          .map((m) => m.email);
        setSelectedEmails(leaderEmails);
      }
    }
  }, [open, event, teamMembers]);

  const toggleParticipant = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !date) return;

    const startDate = `${date}T${startTime}:00`;
    const endDate = `${date}T${endTime}:00`;

    await onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      date: `${date}T${startTime}:00`,
      startDate,
      endDate,
      participantEmails: selectedEmails.length > 0 ? selectedEmails : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Evento" : "Novo Evento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="event-title">Título *</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião com cliente"
              maxLength={200}
            />
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as TipoEvento)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="event-date">Data *</Label>
            <Input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="event-start">Início</Label>
              <Input
                id="event-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end">Fim</Label>
              <Input
                id="event-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="event-desc">Descrição</Label>
            <Textarea
              id="event-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes do evento..."
              rows={3}
              maxLength={2000}
            />
          </div>

          {/* Participantes */}
          {teamMembers.length > 0 && (
            <div className="space-y-2">
              <Label>Participantes</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {teamMembers.map((member) => (
                  <div key={member.userId} className="flex items-center gap-2">
                    <Checkbox
                      id={`member-${member.userId}`}
                      checked={selectedEmails.includes(member.email)}
                      onCheckedChange={() => toggleParticipant(member.email)}
                    />
                    <Label
                      htmlFor={`member-${member.userId}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {member.name}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({member.role === "OWNER" ? "Dono" : member.role === "ADMIN" ? "Admin" : "Membro"})
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
              {selectedEmails.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedEmails.map((email) => {
                    const member = teamMembers.find((m) => m.email === email);
                    return (
                      <Badge
                        key={email}
                        variant="secondary"
                        className="gap-1 text-xs cursor-pointer"
                        onClick={() => toggleParticipant(email)}
                      >
                        {member?.name || email}
                        <X className="h-3 w-3" />
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {isEditing && onDelete && (
            <Button
              variant="destructive"
              onClick={() => onDelete(event!.id)}
              disabled={isPending}
              className="mr-auto"
            >
              Excluir
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !title.trim() || !date}
          >
            {isPending ? "Salvando..." : isEditing ? "Salvar" : "Criar Evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
