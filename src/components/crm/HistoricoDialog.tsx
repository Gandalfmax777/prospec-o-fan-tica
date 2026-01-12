import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Lead } from '@/types/crm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TemperaturaBadge, StatusBadge } from './StatusBadge';
import { Phone, MessageSquare, Mail, Users, MapPin, MoreHorizontal, MapPin as MapPinIcon, FileText } from 'lucide-react';

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

        <div className="py-4 space-y-6">
          {/* Seção de Informações do Lead */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <MapPinIcon className="w-4 h-4" />
              Informações do Lead
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Cidade:</span>
                <span className="ml-2 font-medium">{lead.cidade}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Telefone:</span>
                <a 
                  href={`tel:${lead.telefone}`}
                  className="ml-2 font-medium text-primary hover:underline"
                >
                  {lead.telefone}
                </a>
              </div>
            </div>
            {lead.observacao && lead.observacao.trim() !== '' && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-muted-foreground text-xs font-medium block mb-1">
                      Observação Inicial:
                    </span>
                    <p className="text-sm italic text-foreground leading-relaxed">
                      {lead.observacao}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline de Histórico */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Histórico de Contatos</h3>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
