import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { useCRM } from "@/context/CRMContext";
import { Lead } from "@/types/crm";
import { StatusBadge, TemperaturaBadge, PrioridadeBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  ThermometerSun,
  Eye,
  Copy,
  AlertTriangle,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { BriefingDialog } from "./BriefingDialog";

export const PendenciasTab = () => {
  const { leads, registrarContato, moverTemperatura } = useCRM();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);

  const ativos = leads.filter((lead) => lead.status !== "Convertido");

  const atrasados = ativos.filter((lead) => lead.status === "Atrasado");
  const quaseAtrasados = ativos.filter((lead) => {
    if (!lead.proximoContato) return false;
    const dias = differenceInDays(lead.proximoContato, new Date());
    return dias === 1 || dias === 2;
  });

  const gerarSugestaoFollowUp = (lead: Lead): string => {
    const diasSemContato = lead.ultimoContato
      ? differenceInDays(new Date(), lead.ultimoContato)
      : 999;

    if (lead.status === "Atrasado") {
      if (lead.temperatura === "Quente") {
        return `Ola ${lead.nome.split(" ")[0]}! Estou entrando em contato pois percebi que faz alguns dias que nao conversamos. Tenho novidades que podem te interessar. Podemos marcar uma conversa rapida?`;
      }
      return `Ola ${lead.nome.split(" ")[0]}! Tudo bem? Faz um tempinho que nao conversamos e queria saber como voce esta. Posso ajudar em algo?`;
    }

    if (diasSemContato > 7) {
      return `Oi ${lead.nome.split(" ")[0]}! Como vai? Passando para dar um alo e saber se surgiu alguma novidade por ai. Fico a disposicao!`;
    }

    if (lead.temperatura === "Quente") {
      return `Ola ${lead.nome.split(" ")[0]}! Vamos fechar essa parceria? Estou disponivel para tirar qualquer duvida final que voce tenha!`;
    }

    if (lead.temperatura === "Morno") {
      return `Oi ${lead.nome.split(" ")[0]}! Espero que esteja tudo bem. Queria saber se conseguiu analisar nossa proposta. Posso te ligar para conversarmos?`;
    }

    return `Ola ${lead.nome.split(" ")[0]}! Tudo bem? Queria retomar nosso contato e entender melhor suas necessidades. Quando podemos conversar?`;
  };

  const copiarMensagem = (mensagem: string) => {
    navigator.clipboard.writeText(mensagem);
    toast({
      title: "Mensagem copiada!",
      description: "A sugestao de follow-up foi copiada para a area de transferencia.",
    });
  };

  const LeadCard = ({ lead, isQuaseAtrasado = false }: { lead: Lead; isQuaseAtrasado?: boolean }) => (
    <Card className={isQuaseAtrasado ? "border-[hsl(var(--priority-warning))]" : "border-[hsl(var(--status-atrasado))]"}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold">{lead.nome}</h4>
            <p className="text-sm text-muted-foreground">{lead.cidade} - {lead.telefone}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <PrioridadeBadge prioridade={lead.prioridade} />
            <TemperaturaBadge temperatura={lead.temperatura} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div>
            <span className="text-muted-foreground">Ultimo contato:</span>
            <span className="ml-1 font-medium">
              {lead.ultimoContato ? format(lead.ultimoContato, "dd/MM") : "-"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Proximo:</span>
            <span
              className={`ml-1 font-medium ${
                isQuaseAtrasado ? "text-[hsl(var(--priority-warning))]" : "text-[hsl(var(--status-atrasado))]"
              }`}
            >
              {lead.proximoContato ? format(lead.proximoContato, "dd/MM") : "-"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={async () => {
              try {
                await registrarContato(lead.id);
              } catch (err) {
                console.error("Erro ao registrar contato:", err);
              }
            }}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Registrar contato
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedLead(lead);
              setShowBriefing(true);
            }}
          >
            <Eye className="w-3 h-3 mr-1" />
            Ver no CRM
          </Button>
          {lead.temperatura !== "Quente" && (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await moverTemperatura(lead.id, lead.temperatura === "Frio" ? "Morno" : "Quente");
                } catch (err) {
                  console.error("Erro ao mover temperatura:", err);
                }
              }}
            >
              <ThermometerSun className="w-3 h-3 mr-1" />
              Esquentar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[hsl(var(--status-atrasado))]" />
            <CardTitle>Atrasados ({atrasados.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
            {atrasados.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--status-em-dia))]" />
                  Nenhum lead atrasado.
                </CardContent>
              </Card>
            ) : (
              atrasados.map((lead) => <LeadCard key={lead.id} lead={lead} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Clock className="w-5 h-5 text-[hsl(var(--priority-warning))]" />
            <CardTitle>Quase atrasados ({quaseAtrasados.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
            {quaseAtrasados.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--status-em-dia))]" />
                  Todos os prazos estao em dia.
                </CardContent>
              </Card>
            ) : (
              quaseAtrasados.map((lead) => <LeadCard key={lead.id} lead={lead} isQuaseAtrasado />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <CardTitle>Sugestoes de follow-up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
            {[...atrasados, ...quaseAtrasados].slice(0, 5).map((lead) => (
              <Card key={lead.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>{lead.nome}</span>
                    <TemperaturaBadge temperatura={lead.temperatura} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3 italic">"{gerarSugestaoFollowUp(lead)}"</p>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => copiarMensagem(gerarSugestaoFollowUp(lead))}>
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar mensagem
                  </Button>
                </CardContent>
              </Card>
            ))}
            {atrasados.length === 0 && quaseAtrasados.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Sem sugestoes no momento.
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
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
