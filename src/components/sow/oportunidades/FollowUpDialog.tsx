import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGerarFollowUp } from "@/hooks/sow/useSoW";
import type { SoWOportunidade } from "@/types/sow";
import { toast } from "sonner";
import { Copy, Info, Loader2, Sparkles } from "lucide-react";

// Rascunho de follow-up assistido por IA. Nada é enviado — apenas gera texto
// que o assessor copia e revisa manualmente.
export function FollowUpDialog({
  oportunidade,
  open,
  onOpenChange,
}: {
  oportunidade: SoWOportunidade;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [canal, setCanal] = useState("whatsapp");
  const [tom, setTom] = useState("cordial");
  const [texto, setTexto] = useState("");
  const gerar = useGerarFollowUp();

  // Limpa o rascunho ao (re)abrir p/ outra oportunidade.
  useEffect(() => {
    if (open) setTexto("");
  }, [open, oportunidade.id]);

  const handleGerar = async () => {
    try {
      const res = await gerar.mutateAsync({
        clienteId: oportunidade.clienteId,
        oportunidadeId: oportunidade.id,
        canal,
        tom,
      });
      setTexto(res.texto ?? "");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao gerar o rascunho");
    }
  };

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Rascunho copiado para a área de transferência");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-4 w-4 text-primary" />
            Follow-up com IA
          </DialogTitle>
          <DialogDescription>
            {oportunidade.clienteNome ?? "Cliente"}
            {oportunidade.instituicao ? ` · ${oportunidade.instituicao}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Canal</Label>
              <Select value={canal} onValueChange={setCanal}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tom</Label>
              <Select value={tom} onValueChange={setTom}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cordial">Cordial</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGerar} disabled={gerar.isPending} className="w-full gap-2">
            {gerar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {gerar.isPending ? "Gerando..." : texto ? "Gerar novamente" : "Gerar rascunho"}
          </Button>

          {gerar.isPending && !texto ? (
            <Skeleton className="h-44 w-full rounded-md" />
          ) : texto ? (
            <div className="space-y-2">
              <Textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="min-h-[180px] text-sm"
              />
              <Button variant="outline" size="sm" onClick={handleCopiar} className="gap-2">
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </Button>
            </div>
          ) : null}

          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            Rascunho de apoio — revise e envie você mesmo. Nada é enviado automaticamente.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
