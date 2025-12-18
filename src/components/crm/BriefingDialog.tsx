import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Lead, TipoContato, Temperatura } from '@/types/crm';
import { useCRM } from '@/context/CRMContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BriefingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

export const BriefingDialog = ({ open, onOpenChange, lead }: BriefingDialogProps) => {
  const { adicionarBriefing } = useCRM();
  const [briefing, setBriefing] = useState({
    tipoContato: 'Ligação' as TipoContato,
    objetivo: '',
    conversa: '',
    resultado: '',
    interesseDemonstrado: '',
    objecoes: '',
    proximoPasso: '',
    proximoFollowUp: null as Date | null,
    temperaturaAtualizada: lead.temperatura,
  });

  const handleSubmit = async () => {
    try {
      await adicionarBriefing(lead.id, briefing);
      onOpenChange(false);
      setBriefing({
        tipoContato: 'Ligação',
        objetivo: '',
        conversa: '',
        resultado: '',
        interesseDemonstrado: '',
        objecoes: '',
        proximoPasso: '',
        proximoFollowUp: null,
        temperaturaAtualizada: lead.temperatura,
      });
    } catch (err) {
      console.error('Erro ao adicionar briefing:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Briefing - {lead.nome}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Contato</label>
              <Select
                value={briefing.tipoContato}
                onValueChange={(v: TipoContato) => setBriefing({ ...briefing, tipoContato: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Ligação', 'WhatsApp', 'Email', 'Reunião', 'Visita', 'Outro'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Temperatura Atualizada</label>
              <Select
                value={briefing.temperaturaAtualizada}
                onValueChange={(v: Temperatura) => setBriefing({ ...briefing, temperaturaAtualizada: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Frio">❄️ Frio</SelectItem>
                  <SelectItem value="Morno">🌤️ Morno</SelectItem>
                  <SelectItem value="Quente">🔥 Quente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Objetivo da Conversa</label>
            <Input
              value={briefing.objetivo}
              onChange={e => setBriefing({ ...briefing, objetivo: e.target.value })}
              placeholder="Qual era o objetivo deste contato?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">O que foi falado</label>
            <Textarea
              value={briefing.conversa}
              onChange={e => setBriefing({ ...briefing, conversa: e.target.value })}
              placeholder="Resumo da conversa..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Resultado da Conversa</label>
            <Input
              value={briefing.resultado}
              onChange={e => setBriefing({ ...briefing, resultado: e.target.value })}
              placeholder="Como foi o resultado?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Interesse Demonstrado</label>
              <Input
                value={briefing.interesseDemonstrado}
                onChange={e => setBriefing({ ...briefing, interesseDemonstrado: e.target.value })}
                placeholder="Nível de interesse"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Objeções Comentadas</label>
              <Input
                value={briefing.objecoes}
                onChange={e => setBriefing({ ...briefing, objecoes: e.target.value })}
                placeholder="Objeções levantadas"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Próximo Passo</label>
            <Input
              value={briefing.proximoPasso}
              onChange={e => setBriefing({ ...briefing, proximoPasso: e.target.value })}
              placeholder="Qual o próximo passo?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Data do Próximo Follow-up</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !briefing.proximoFollowUp && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {briefing.proximoFollowUp
                    ? format(briefing.proximoFollowUp, 'PPP', { locale: ptBR })
                    : 'Selecione uma data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={briefing.proximoFollowUp || undefined}
                  onSelect={(date) => setBriefing({ ...briefing, proximoFollowUp: date || null })}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Salvar Briefing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
