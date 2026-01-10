import { useCRM } from "@/context/CRMContext";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface AlertaBannerProps {
  onNavigate: (tab: string) => void;
}

export const AlertaBanner = ({ onNavigate }: AlertaBannerProps) => {
  const { leads } = useCRM();
  const [dismissed, setDismissed] = useState(false);

  const atrasados = leads.filter((lead) => lead.status === "Atrasado").length;

  if (atrasados === 0 || dismissed) return null;

  return (
    <Alert
      variant="destructive"
      className={cn(
        "bg-[hsl(var(--status-atrasado))] text-[hsl(var(--status-atrasado-foreground,0_0%_100%))] border-[hsl(var(--status-atrasado))]",
        "flex items-center justify-between pr-2"
      )}
    >
      <button
        onClick={() => onNavigate("pendencias")}
        className="flex items-center gap-2 hover:underline flex-1"
      >
        <AlertTriangle className="w-5 h-5" />
        <div>
          <AlertTitle className="mb-0">
            Voce tem {atrasados} lead{atrasados > 1 ? "s" : ""} atrasado{atrasados > 1 ? "s" : ""} hoje
          </AlertTitle>
        </div>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-current hover:bg-white/20 shrink-0"
        onClick={() => setDismissed(true)}
        aria-label="Fechar alerta"
      >
        <X className="w-4 h-4" />
      </Button>
    </Alert>
  );
};
