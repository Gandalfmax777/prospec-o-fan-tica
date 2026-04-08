import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { AgendaEvent, TeamMember, TipoEvento } from "@/types/crm";
import { Trash2, Pencil, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const EVENT_TYPE_LABELS: Record<TipoEvento, string> = {
  CALL: "Ligação",
  EMAIL: "E-mail",
  MEETING: "Reunião",
  NOTE: "Nota",
  TASK: "Tarefa",
  VISIT: "Visita",
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatEventTime(event: AgendaEvent): string {
  if (event.startDate && event.endDate) {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    return `${format(start, "dd/MM/yyyy HH:mm", { locale: ptBR })} — ${format(end, "HH:mm")}`;
  }
  if (event.date) {
    return format(new Date(event.date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  }
  return "—";
}

interface AgendaViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: AgendaEvent | null;
  currentUserId: string;
  teamMembers: TeamMember[];
  onUpdate: (
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
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isPending: boolean;
}

export function AgendaViewDialog({
  open,
  onOpenChange,
  event,
  currentUserId,
  teamMembers,
  onUpdate,
  onDelete,
  isPending,
}: AgendaViewDialogProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Edit state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  // Reset on open/close
  useEffect(() => {
    if (open && event) {
      setMode("view");
      setDeleteOpen(false);
    }
  }, [open, event]);

  // Populate edit fields when entering edit mode
  useEffect(() => {
    if (mode === "edit" && event) {
      setTitle(event.title);
      const cleanDesc = (event.description || "")
        .replace(/\[CDR: .+?\]\s*/g, "")
        .replace(/\[cdrUserId: .+?\]\s*/g, "")
        .trim();
      setDescription(cleanDesc);
      setStartTime(
        event.startDate
          ? format(new Date(event.startDate), "HH:mm")
          : "09:00"
      );
      setEndTime(
        event.endDate
          ? format(new Date(event.endDate), "HH:mm")
          : "10:00"
      );
      setSelectedEmails(
        event.participants?.map((p) => p.user.email) || []
      );
    }
  }, [mode, event]);

  if (!event) return null;

  const cdrUserIdMatch = (event.description || "").match(/\[cdrUserId: (.+?)\]/);
  const isCreator =
    event.user.id === currentUserId ||
    (cdrUserIdMatch != null && cdrUserIdMatch[1] === currentUserId);
  const isParticipant =
    !isCreator &&
    event.participants?.some((p) => p.userId === currentUserId);

  const cleanDescription = (event.description || "")
    .replace(/\[CDR: .+?\]\s*/g, "")
    .replace(/\[cdrUserId: .+?\]\s*/g, "")
    .trim();

  const toggleParticipant = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email)
        ? prev.filter((e) => e !== email)
        : [...prev, email]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    const dateStr = event.startDate
      ? new Date(event.startDate).toISOString().split("T")[0]
      : event.date
        ? new Date(event.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

    await onUpdate(event.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      type: event.type,
      date: `${dateStr}T${startTime}:00`,
      startDate: `${dateStr}T${startTime}:00`,
      endDate: `${dateStr}T${endTime}:00`,
      participantEmails:
        selectedEmails.length > 0 ? selectedEmails : undefined,
    });
  };

  const handleDelete = async () => {
    await onDelete(event.id);
    setDeleteOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === "edit" ? "Editar Evento" : event.title}
            </DialogTitle>
          </DialogHeader>

          {mode === "view" ? (
            /* ── View Mode ── */
            <div className="space-y-4 py-2">
              {/* Tipo */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Tipo
                </Label>
                <div>
                  <Badge variant="secondary">
                    {EVENT_TYPE_LABELS[event.type] || event.type}
                  </Badge>
                </div>
              </div>

              {/* Descrição */}
              {cleanDescription && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Descrição
                  </Label>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {cleanDescription}
                  </p>
                </div>
              )}

              {/* Horário */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Horário
                </Label>
                <p className="text-sm text-foreground">
                  {formatEventTime(event)}
                </p>
              </div>

              {/* Contato */}
              {event.contact && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Contato
                  </Label>
                  <p className="text-sm text-foreground">
                    {event.contact.name}
                  </p>
                </div>
              )}

              {/* Negócio */}
              {event.deal && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Negócio
                  </Label>
                  <p className="text-sm text-foreground">
                    {event.deal.title}
                  </p>
                </div>
              )}

              {/* Participantes */}
              {event.participants && event.participants.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Participantes
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {event.participants.map((p) => (
                      <div
                        key={p.userId}
                        className="flex items-center gap-1.5"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[8px] font-medium bg-muted">
                            {getInitials(p.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {p.user.name || p.user.email}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Convidado por */}
              {isParticipant && (
                <p className="text-sm text-muted-foreground italic">
                  Você foi convidado por{" "}
                  {event.user.name || "alguém"}
                </p>
              )}
            </div>
          ) : (
            /* ── Edit Mode ── */
            <div className="space-y-4">
              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="view-edit-title">Título *</Label>
                <Input
                  id="view-edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Reunião com cliente"
                  maxLength={200}
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="view-edit-desc">Descrição</Label>
                <Textarea
                  id="view-edit-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes do evento..."
                  rows={4}
                  maxLength={2000}
                  className="resize-none"
                />
              </div>

              {/* Horários */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="view-edit-start">Início</Label>
                  <Input
                    id="view-edit-start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="view-edit-end">Fim</Label>
                  <Input
                    id="view-edit-end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Participantes */}
              {teamMembers.length > 0 && (
                <div className="space-y-2">
                  <Label>Participantes</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {teamMembers.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          id={`view-member-${member.userId}`}
                          checked={selectedEmails.includes(
                            member.email
                          )}
                          onCheckedChange={() =>
                            toggleParticipant(member.email)
                          }
                        />
                        <Label
                          htmlFor={`view-member-${member.userId}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {member.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {mode === "view" ? (
              <>
                {isCreator && (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteOpen(true)}
                      disabled={isPending}
                      className="mr-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMode("edit")}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Fechar
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setMode("view")}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isPending || !title.trim()}
                >
                  {isPending ? "Salvando..." : "Salvar"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Atividade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta atividade? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
