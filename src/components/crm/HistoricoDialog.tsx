import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Lead } from '@/types/crm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TemperaturaBadge, StatusBadge } from './StatusBadge';
import { Phone, MessageSquare, Mail, Users, MapPin, MoreHorizontal } from 'lucide-react';

interface HistoricoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

const getTipoIcon = (tipo: string) => {
  switch (tipo) {
    case 'Ligação':
      return <Phone className="w-4 h-4" />;
    case 'WhatsApp':
      return <MessageSquare className="w-4 h-4" />;
    case 'Email':
      return <Mail className="w-4 h-4" />;
    case 'Reunião':
      return <Users className="w-4 h-4" />;
    case 'Visita':
      return <MapPin className="w-4 h-4" />;
    default:
      return <MoreHorizontal className="w-4 h-4" />;
  }
};

export const HistoricoDialog = ({ open, onOpenChange, lead }: HistoricoDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Contatos - {lead.nome}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {lead.historico.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum histórico de contato registrado.
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-6">
                {lead.historico.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((item) => (
                  <div key={item.id} className="relative pl-10">
                    <div className="absolute left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      {getTipoIcon(item.tipo)}
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.tipo}</span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(item.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TemperaturaBadge temperatura={item.temperatura} />
                          <StatusBadge status={item.status} />
                        </div>
                      </div>
                      {item.resumo && (
                        <p className="text-sm mb-2">{item.resumo}</p>
                      )}
                      {item.proximoPasso && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Próximo passo:</strong> {item.proximoPasso}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Por: {item.responsavel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
