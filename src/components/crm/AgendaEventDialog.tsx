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
import type { TeamMember, TipoEvento } from "@/types/crm";
import { X } from "lucide-react";

const EVENT_TYPES: { value: TipoEvento; label: string }[] = [
  { value: "MEETING", label: "Reunião" },
  { value: "TASK", label: "Tarefa" },
  { value: "CALL", label: "Ligação" },
  { value: "EMAIL", label: "E-mail" },
  { value: "VISIT", label: "Visita" },
];

interface AgendaEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers: TeamMember[];
  onSave: (data: {
    title: string;
    description?: string;
    type: TipoEvento;
    date: string;
    startDate?: string;
    endDate?: string;
    participantEmails?: string[];
    assigneeEmail?: string;
  }) => Promise<void>;
  isPending?: boolean;
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
}

export function AgendaEventDialog({
  open,
  onOpenChange,
  teamMembers,
  onSave,
  isPending = false,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
}: AgendaEventDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TipoEvento>("MEETING");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setType("MEETING");
      setDate(defaultDate || new Date().toISOString().split("T")[0]);
      setStartTime(defaultStartTime || "09:00");
      setEndTime(defaultEndTime || "10:00");
      setAssigneeEmail("");
      setSelectedEmails([]);
    }
  }, [open, teamMembers, defaultDate, defaultStartTime, defaultEndTime]);

  const toggleParticipant = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !date || !assigneeEmail) return;

    const startDate = `${date}T${startTime}:00`;
    const endDate = `${date}T${endTime}:00`;

    // Garantir que o corretor responsável também é participante
    const allParticipants = new Set(selectedEmails);
    allParticipants.add(assigneeEmail);

    await onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      date: startDate,
      startDate,
      endDate,
      assigneeEmail,
      participantEmails: Array.from(allParticipants),
    });
  };

  // Separar corretores (não-MEMBER) e membros para exibição
  const corretores = teamMembers.filter(
    (m) => m.role === "OWNER" || m.role === "ADMIN" || m.role === "MEMBER"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Evento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Corretor Responsável */}
          {corretores.length > 0 && (
            <div className="space-y-2">
              <Label>Corretor Responsável *</Label>
              <Select
                value={assigneeEmail}
                onValueChange={setAssigneeEmail}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o corretor..." />
                </SelectTrigger>
                <SelectContent>
                  {corretores.map((m) => (
                    <SelectItem key={m.userId} value={m.email}>
                      {m.name}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({m.role === "OWNER"
                          ? "Dono"
                          : m.role === "ADMIN"
                            ? "Admin"
                            : "Membro"})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                O evento será criado no calendário deste corretor.
              </p>
            </div>
          )}

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo de Atividade</Label>
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

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="event-desc">Descrição</Label>
            <Textarea
              id="event-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes do evento..."
              rows={4}
              maxLength={2000}
              className="resize-none"
            />
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

          {/* Participantes Adicionais */}
          {teamMembers.length > 1 && (
            <div className="space-y-2">
              <Label>Outros Participantes</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {teamMembers
                  .filter((m) => m.email !== assigneeEmail)
                  .map((member) => (
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !title.trim() || !date || !assigneeEmail}
          >
            {isPending ? "Criando..." : "Criar Evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
