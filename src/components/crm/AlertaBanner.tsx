import { useCRM } from '@/context/CRMContext';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface AlertaBannerProps {
  onNavigate: (tab: string) => void;
}

export const AlertaBanner = ({ onNavigate }: AlertaBannerProps) => {
  const { leads } = useCRM();
  const [dismissed, setDismissed] = useState(false);

  const atrasados = leads.filter(l => l.status === 'Atrasado').length;

  if (atrasados === 0 || dismissed) return null;

  return (
    <div className="bg-[hsl(var(--status-atrasado))] text-[hsl(var(--status-atrasado-foreground,0_0%_100%))] px-4 py-3 flex items-center justify-between rounded-lg mb-4">
      <button
        onClick={() => onNavigate('pendencias')}
        className="flex items-center gap-2 hover:underline"
      >
        <AlertTriangle className="w-5 h-5" />
        <span className="font-medium">
          Você tem {atrasados} lead{atrasados > 1 ? 's' : ''} atrasado{atrasados > 1 ? 's' : ''} hoje
        </span>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-white hover:bg-white/20"
        onClick={() => setDismissed(true)}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};
