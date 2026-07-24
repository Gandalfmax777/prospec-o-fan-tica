import { useMemo, useState, useEffect } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useSoWTimeline, useCreateEvento, useDeleteEvento } from "@/hooks/sow/useSoW";
import { formatBRLCompacto, parseBRL } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { SoWEventoTimeline, SoWTipoEvento } from "@/types/sow";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock, CalendarIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const TIPOS: SoWTipoEvento[] = [
  "Vencimento",
  "Aporte",
  "Resgate",
  "Movimentação",
  "Contato",
  "Oportunidade",
  "Alerta",
  "Outro",
];

function dotColor(iso: string): string {
  try {
    const days = Math.abs(differenceInCalendarDays(parseISO(iso), new Date()));
    if (days <= 30) return "bg-destructive";
    if (days <= 90) return "bg-[hsl(38_92%_50%)]";
    return "bg-primary";
  } catch {
    return "bg-primary";
  }
}

function NovoEventoDialog({
  clienteId,
  open,
  onOpenChange,
}: {
  clienteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate, isPending } = useCreateEvento(clienteId);
  const [data, setData] = useState<Date | undefined>(new Date());
  const [tipo, setTipo] = useState<SoWTipoEvento>("Contato");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (!open) {
      setData(new Date());
      setTipo("Contato");
      setDescricao("");
      setValor("");
    }
  }, [open]);

  const handleSubmit = () => {
    if (!data) {
      toast.error("Selecione a data do evento.");
      return;
    }
    if (!descricao.trim()) {
      toast.error("Informe a descrição do evento.");
      return;
    }
    mutate(
      {
        data: data.toISOString(),
        tipo,
        descricao: descricao.trim(),
        valor: valor.trim() ? parseBRL(valor) : null,
      },
      {
        onSuccess: () => {
          toast.success("Evento adicionado!");
          onOpenChange(false);
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Erro ao adicionar evento."),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo evento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data ? format(data, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data}
                    onSelect={setData}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v: SoWTipoEvento) => setTipo(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição do evento"
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Valor (R$)</Label>
            <Input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00 (opcional)"
              inputMode="decimal"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Salvando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClienteTimeline({ clienteId }: { clienteId: string }) {
  const { data, isLoading } = useSoWTimeline(clienteId);
  const deleteEvento = useDeleteEvento(clienteId);
  const [showNew, setShowNew] = useState(false);
  const [toDelete, setToDelete] = useState<SoWEventoTimeline | null>(null);

  const eventos = useMemo(() => {
    const list = data ?? [];
    return [...list].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Timeline</h3>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo evento
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : eventos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <CalendarClock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum evento na timeline ainda.</p>
        </div>
      ) : (
        <div className="ml-2 border-l border-border pl-6">
          {eventos.map((ev) => (
            <div key={ev.id} className="relative pb-4">
              <span
                className={cn(
                  "absolute -left-[31px] top-2 h-3 w-3 rounded-full ring-4 ring-background",
                  dotColor(ev.data)
                )}
              />
              <div className="rounded-lg border border-border/50 bg-card p-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {ev.tipo}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(ev.data), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ev.valor != null && (
                      <span className="text-sm font-semibold text-foreground tabular-nums">
                        {formatBRLCompacto(ev.valor)}
                      </span>
                    )}
                    {/* Vencimentos são derivados do ativo — só somem quando o ativo some. */}
                    {ev.origem === "evento" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setToDelete(ev)}
                        title="Excluir evento"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-1.5 text-sm text-foreground">{ev.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <NovoEventoDialog clienteId={clienteId} open={showNew} onOpenChange={setShowNew} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{toDelete?.descricao}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteEvento.isPending}
              onClick={() => {
                if (!toDelete) return;
                deleteEvento.mutate(toDelete.id, {
                  onSuccess: () => {
                    toast.success("Evento excluído.");
                    setToDelete(null);
                  },
                  onError: (err) =>
                    toast.error(err instanceof Error ? err.message : "Erro ao excluir evento."),
                });
              }}
            >
              {deleteEvento.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
