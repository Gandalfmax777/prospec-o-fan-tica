import { useState } from 'react';
import { format } from 'date-fns';
import { useCRM } from '@/context/CRMContext';
import { Lead, Temperatura } from '@/types/crm';
import { StatusBadge, PrioridadeBadge } from './StatusBadge';
import { cn } from '@/lib/utils';
import { Phone, MapPin, Calendar, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BriefingDialog } from './BriefingDialog';

export const KanbanBoard = () => {
  const { leads, moverTemperatura, registrarContato, converterLead } = useCRM();
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);

  const activeLeads = leads.filter(l => l.status !== 'Convertido');
  
  const leadsFrios = activeLeads.filter(l => l.temperatura === 'Frio');
  const leadsMornos = activeLeads.filter(l => l.temperatura === 'Morno');
  const leadsQuentes = activeLeads.filter(l => l.temperatura === 'Quente');

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, temperatura: Temperatura) => {
    e.preventDefault();
    if (draggedLead && draggedLead.temperatura !== temperatura) {
      moverTemperatura(draggedLead.id, temperatura);
    }
    setDraggedLead(null);
  };

  const KanbanCard = ({ lead }: { lead: Lead }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, lead)}
      className="kanban-card mb-3"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-sm">{lead.nome}</h4>
        <PrioridadeBadge prioridade={lead.prioridade} />
      </div>
      
      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {lead.cidade}
        </div>
        <div className="flex items-center gap-1">
          <Phone className="w-3 h-3" />
          {lead.telefone}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground/70">
          Código: {lead.codigo}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground/70">
          Origem: {lead.origem}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Cadência:</span>
          <span className="font-medium">{lead.cadencia}</span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-muted-foreground">Último:</span>
          <span>{lead.ultimoContato ? format(lead.ultimoContato, 'dd/MM') : '-'}</span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-muted-foreground">Próximo:</span>
          <span className={cn(
            lead.status === 'Atrasado' && 'text-[hsl(var(--status-atrasado))] font-medium',
            lead.status === 'Falar Hoje' && 'text-[hsl(var(--status-falar-hoje))] font-medium'
          )}>
            {lead.proximoContato ? format(lead.proximoContato, 'dd/MM') : '-'}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <StatusBadge status={lead.status} />
      </div>

      {lead.observacao && (
        <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">
          {lead.observacao}
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-border flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => registrarContato(lead.id)}
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Contato
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => {
            setSelectedLead(lead);
            setShowBriefing(true);
          }}
        >
          <MessageSquare className="w-3 h-3 mr-1" />
          Briefing
        </Button>
        {lead.temperatura === 'Quente' && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-primary"
            onClick={() => converterLead(lead.id)}
          >
            <ArrowRight className="w-3 h-3 mr-1" />
            Converter
          </Button>
        )}
      </div>
    </div>
  );

  const KanbanColumn = ({ 
    title, 
    leads, 
    temperatura, 
    colorClass 
  }: { 
    title: string; 
    leads: Lead[]; 
    temperatura: Temperatura;
    colorClass: string;
  }) => (
    <div
      className={cn('kanban-column flex-1', colorClass)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, temperatura)}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <span className="metric-badge bg-background/50 text-foreground font-bold">
          {leads.length}
        </span>
      </div>
      <div className="space-y-0">
        {leads.map(lead => (
          <KanbanCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Arraste leads para cá
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Kanban de Prospecção</h2>
      
      <div className="flex gap-4 overflow-x-auto pb-4">
        <KanbanColumn
          title="❄️ Frio"
          leads={leadsFrios}
          temperatura="Frio"
          colorClass="bg-[hsl(var(--temp-frio-bg))] border border-[hsl(var(--temp-frio)/0.3)]"
        />
        <KanbanColumn
          title="🌤️ Morno"
          leads={leadsMornos}
          temperatura="Morno"
          colorClass="bg-[hsl(var(--temp-morno-bg))] border border-[hsl(var(--temp-morno)/0.3)]"
        />
        <KanbanColumn
          title="🔥 Quente"
          leads={leadsQuentes}
          temperatura="Quente"
          colorClass="bg-[hsl(var(--temp-quente-bg))] border border-[hsl(var(--temp-quente)/0.3)]"
        />
      </div>

      {selectedLead && (
        <BriefingDialog
          open={showBriefing}
          onOpenChange={setShowBriefing}
          lead={selectedLead}
        />
      )}
    </div>
  );
};
