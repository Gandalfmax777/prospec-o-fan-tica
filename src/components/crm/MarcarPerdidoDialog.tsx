import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCRM } from "@/context/CRMContext";
import { toast } from "@/hooks/use-toast";
import { Lead } from "@/types/crm";
import { Loader2, UserX } from "lucide-react";

const MOTIVOS = [
  "Negou",
  "Bloqueou",
  "Sem interesse",
  "Sem resposta",
  "Outro",
] as const;

interface MarcarPerdidoDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MarcarPerdidoDialog = ({
  lead,
  open,
  onOpenChange,
}: MarcarPerdidoDialogProps) => {
  const { marcarPerdido } = useCRM();
  const [motivoTipo, setMotivoTipo] = useState<string>("");
  const [detalhe, setDetalhe] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setMotivoTipo("");
    setDetalhe("");
  };

  const handleConfirm = async () => {
    if (!lead) return;
    const motivo =
      [motivoTipo, detalhe.trim()].filter(Boolean).join(" — ") || undefined;
    try {
      setSaving(true);
      await marcarPerdido(lead.id, motivo);
      toast({
        title: "Lead movido para Perdidos",
        description: `"${lead.nome}" entrou no banco de perdidos da equipe.`,
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Erro ao mover para Perdidos",
        description:
          err instanceof Error ? err.message : "Não foi possível mover o lead.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-[hsl(var(--status-perdido))]" />
            Mover para Perdidos
          </DialogTitle>
          <DialogDescription>
            O lead sai do seu funil ativo e entra no banco de perdidos da equipe,
            onde outro assessor pode assumi-lo depois para tentar de novo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Select value={motivoTipo} onValueChange={setMotivoTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Detalhes (opcional)</Label>
            <Textarea
              value={detalhe}
              onChange={(e) => setDetalhe(e.target.value)}
              placeholder="Ex.: pediu para não contatar mais, número errado, já é cliente de outra corretora..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Mover para Perdidos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
