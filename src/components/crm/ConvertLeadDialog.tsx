import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCRM } from "@/context/CRMContext";
import { useToast } from "@/hooks/use-toast";
import { Lead } from "@/types/crm";
import { CheckCircle, Loader2, Trophy } from "lucide-react";
import { useState } from "react";

interface ConvertLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConvertLeadDialog({
  lead,
  open,
  onOpenChange,
}: ConvertLeadDialogProps) {
  const { converterLead } = useCRM();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  function handleClose() {
    if (loading) return; // não fechar durante operação
    onOpenChange(false);
  }

  async function handleConvert() {
    if (!lead) return;
    try {
      setLoading(true);
      await converterLead(lead.id);
      toast({
        title: "Contato convertido!",
        description: `${lead.nome} foi movido para a aba Convertidos.`,
      });
      onOpenChange(false);
      setLoading(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao converter lead";
      toast({ title: "Erro", description: message, variant: "destructive" });
      setLoading(false);
    }
  }

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <DialogTitle>Converter Contato</DialogTitle>
          </div>
          <DialogDescription className="pt-1">
            <span className="font-medium text-foreground">{lead.nome}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-1">
          <p className="text-sm text-muted-foreground">
            Isto move o contato para a aba <strong>Convertidos</strong>.
          </p>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={handleConvert}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Converter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
