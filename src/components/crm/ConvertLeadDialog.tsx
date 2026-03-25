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
import {
  ArrowUpRight,
  CheckCircle,
  ExternalLink,
  Loader2,
  Trophy,
} from "lucide-react";
import { useState } from "react";

interface ConvertLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "confirm" | "loading" | "success";

export function ConvertLeadDialog({
  lead,
  open,
  onOpenChange,
}: ConvertLeadDialogProps) {
  const { converterLead, transferLead } = useCRM();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("confirm");
  const [loadingAction, setLoadingAction] = useState<
    "convert" | "convert-and-send" | null
  >(null);
  const [crmDealUrl, setCrmDealUrl] = useState<string | null>(null);

  function handleClose() {
    if (loadingAction) return; // não fechar durante operação
    onOpenChange(false);
    // reset após animação de saída
    setTimeout(() => {
      setStep("confirm");
      setLoadingAction(null);
      setCrmDealUrl(null);
    }, 200);
  }

  async function handleSoloConvert() {
    if (!lead) return;
    try {
      setLoadingAction("convert");
      await converterLead(lead.id);
      toast({
        title: "Lead convertido!",
        description: `${lead.nome} foi movido para a aba Convertidos. Você pode enviá-lo ao CRM quando desejar.`,
      });
      onOpenChange(false);
      setTimeout(() => {
        setStep("confirm");
        setLoadingAction(null);
      }, 200);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao converter lead";
      toast({ title: "Erro", description: message, variant: "destructive" });
      setLoadingAction(null);
    }
  }

  async function handleConvertAndSend() {
    if (!lead) return;
    try {
      setLoadingAction("convert-and-send");
      setStep("loading");

      // Passo 1: converter
      await converterLead(lead.id);

      // Passo 2: transferir ao CRM
      await transferLead(lead.id);

      // Pegar a URL do deal atualizada do lead (após refresh do contexto)
      // O transferLead atualiza o estado local com crmDealUrl
      setCrmDealUrl(lead.crmDealUrl ?? null);
      setStep("success");
      setLoadingAction(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao enviar ao CRM";
      toast({ title: "Erro ao enviar ao CRM", description: message, variant: "destructive" });
      setStep("confirm");
      setLoadingAction(null);
    }
  }

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {/* Etapa 1: Confirmação */}
        {step === "confirm" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <DialogTitle>Converter Lead</DialogTitle>
              </div>
              <DialogDescription className="pt-1">
                <span className="font-medium text-foreground">{lead.nome}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1">
              <p className="text-sm text-muted-foreground">
                Escolha o que deseja fazer com este lead:
              </p>

              {/* Opção 1 */}
              <div className="rounded-lg border border-border/60 p-3 space-y-1">
                <p className="text-sm font-medium">Apenas converter</p>
                <p className="text-xs text-muted-foreground">
                  Move o lead para a aba <strong>Convertidos</strong>. Você
                  poderá enviá-lo ao CRM depois, quando quiser.
                </p>
              </div>

              {/* Opção 2 */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
                <p className="text-sm font-medium">Converter e Enviar ao CRM</p>
                <p className="text-xs text-muted-foreground">
                  Converte o lead e já cria o contato e o negócio no CRM
                  automaticamente. Você recebe o link direto para acompanhar.
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleSoloConvert}
                disabled={!!loadingAction}
              >
                {loadingAction === "convert" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Apenas Converter
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={handleConvertAndSend}
                disabled={!!loadingAction}
              >
                {loadingAction === "convert-and-send" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                )}
                Converter e Enviar ao CRM
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Etapa 2: Carregando */}
        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center space-y-1">
              <p className="font-medium">Enviando ao CRM...</p>
              <p className="text-sm text-muted-foreground">
                Criando contato e negócio para{" "}
                <strong>{lead.nome}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Etapa 3: Sucesso */}
        {step === "success" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <DialogTitle>Lead enviado ao CRM!</DialogTitle>
              </div>
              <DialogDescription>
                <span className="font-medium text-foreground">{lead.nome}</span>{" "}
                foi convertido e criado no CRM como contato e negócio.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              {crmDealUrl ? (
                <a
                  href={crmDealUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir negócio no CRM
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">
                  O lead aparece na aba Convertidos com o status "Transferido".
                </p>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full sm:w-auto">
                Concluir
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
