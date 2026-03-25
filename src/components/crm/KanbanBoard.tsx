import { Button } from "@/components/ui/button";
import { useCRM } from "@/context/CRMContext";
import { cn } from "@/lib/utils";
import { Lead, Temperatura } from "@/types/crm";
import { format } from "date-fns";
import {
  ArrowRight,
  CheckCircle,
  GripVertical,
  MapPin,
  MessageSquare,
  Phone,
  PanelsTopLeft,
} from "lucide-react";
import { useRef, useState } from "react";
import { BriefingDialog } from "./BriefingDialog";
import { PrioridadeBadge, StatusBadge } from "./StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const KanbanBoard = () => {
  const { leads, moverTemperatura, registrarContato, converterLead } = useCRM();
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Temperatura | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);
  const dragElementRef = useRef<HTMLElement | null>(null);

  const activeLeads = leads.filter((lead) => lead.status !== "Convertido");

  const leadsFrios = activeLeads.filter((lead) => lead.temperatura === "Frio");
  const leadsMornos = activeLeads.filter((lead) => lead.temperatura === "Morno");
  const leadsQuentes = activeLeads.filter((lead) => lead.temperatura === "Quente");

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    const target = e.currentTarget as HTMLElement;
    dragElementRef.current = target;
    target.style.opacity = "0.5";
    setDraggedLead(lead);

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnd = () => {
    if (dragElementRef.current) {
      dragElementRef.current.style.opacity = "1";
      dragElementRef.current = null;
    }
    setDraggedLead(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, temperatura: Temperatura) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";

    if (draggedLead && draggedLead.temperatura !== temperatura) {
      setDragOverColumn(temperatura);
    }
  };

  const handleDragEnter = (e: React.DragEvent, temperatura: Temperatura) => {
    e.preventDefault();
    if (draggedLead && draggedLead.temperatura !== temperatura) {
      setDragOverColumn(temperatura);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const currentTarget = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement;

    if (!currentTarget.contains(relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, temperatura: Temperatura) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedLead && draggedLead.temperatura !== temperatura) {
      try {
        await moverTemperatura(draggedLead.id, temperatura);
      } catch (err) {
        console.error("Erro ao mover temperatura:", err);
      }
    }
    setDraggedLead(null);
  };

  const KanbanCard = ({ lead }: { lead: Lead }) => {
    return (
      <div
        draggable
        onDragStart={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("button")) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
          handleDragStart(e, lead);
        }}
        onDragEnd={handleDragEnd}
        className="kanban-card mb-3 select-none"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing flex-shrink-0" />
            <h4 className="font-semibold text-sm">{lead.nome}</h4>
          </div>
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
            Codigo: {lead.codigo}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground/70">
            Origem: {lead.origem}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Cadencia:</span>
            <span className="font-medium">{lead.cadencia}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-muted-foreground">Ultimo:</span>
            <span>{lead.ultimoContato ? format(lead.ultimoContato, "dd/MM") : "-"}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-muted-foreground">Proximo:</span>
            <span
              className={cn(
                lead.status === "Atrasado" &&
                  "text-[hsl(var(--status-atrasado))] font-medium",
                lead.status === "Falar Hoje" &&
                  "text-[hsl(var(--status-falar-hoje))] font-medium"
              )}
            >
              {lead.proximoContato ? format(lead.proximoContato, "dd/MM") : "-"}
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

        <div
          className="mt-3 pt-3 border-t border-border flex items-center gap-1"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await registrarContato(lead.id);
              } catch (err) {
                console.error("Erro ao registrar contato:", err);
              }
            }}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Contato
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedLead(lead);
              setShowBriefing(true);
            }}
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Briefing
          </Button>
          {lead.temperatura === "Quente" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-primary"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await converterLead(lead.id);
                } catch (err) {
                  console.error("Erro ao converter lead:", err);
                }
              }}
            >
              <ArrowRight className="w-3 h-3 mr-1" />
              Converter
            </Button>
          )}
        </div>
      </div>
    );
  };

  const KanbanColumn = ({
    title,
    leads,
    temperatura,
    colorClass,
  }: {
    title: string;
    leads: Lead[];
    temperatura: Temperatura;
    colorClass: string;
  }) => {
    const isDragOver = dragOverColumn === temperatura;
    const canDrop = draggedLead && draggedLead.temperatura !== temperatura;

    return (
      <div
        className={cn(
          "kanban-column flex-1 rounded-lg p-4",
          colorClass,
          isDragOver && canDrop && "ring-2 ring-primary ring-offset-1"
        )}
        onDragEnter={(e) => handleDragEnter(e, temperatura)}
        onDragOver={(e) => handleDragOver(e, temperatura)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, temperatura)}
        style={{
          transition: isDragOver && canDrop ? "all 0.15s ease" : "none",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{title}</h3>
          <span className="metric-badge bg-background/50 text-foreground font-bold">
            {leads.length}
          </span>
        </div>
        <div className="space-y-0">
          {leads.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} />
          ))}
          {leads.length === 0 && (
            <div
              className={cn(
                "text-center py-8 text-muted-foreground text-sm",
                isDragOver && canDrop && "text-primary font-semibold"
              )}
            >
              {isDragOver && canDrop ? "Solte aqui!" : "Arraste contatos para cá"}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <PanelsTopLeft className="h-5 w-5 text-primary" />
        <CardTitle>Kanban de prospeccao</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto pb-4">
          <KanbanColumn
            title="Frio"
            leads={leadsFrios}
            temperatura="Frio"
            colorClass="bg-[hsl(var(--temp-frio-bg))] border border-[hsl(var(--temp-frio)/0.3)]"
          />
          <KanbanColumn
            title="Morno"
            leads={leadsMornos}
            temperatura="Morno"
            colorClass="bg-[hsl(var(--temp-morno-bg))] border border-[hsl(var(--temp-morno)/0.3)]"
          />
          <KanbanColumn
            title="Quente"
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
      </CardContent>
    </Card>
  );
};
