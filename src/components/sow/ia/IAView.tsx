import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSoW } from "@/context/SoWContext";
import { useSoWClientes, useGerarAlertas, useGerarOportunidades, useGerarScore, useGerarBriefing } from "@/hooks/sow/useSoW";
import { ImportarCarteira } from "./ImportarCarteira";
import { Sparkles, Bell, Target, Gauge, FileText } from "lucide-react";
import { toast } from "sonner";

export default function IAView() {
  const { selectedClienteId, setSelectedClienteId } = useSoW();
  const { data: clientes } = useSoWClientes({});
  const [briefing, setBriefing] = useState<string>("");

  const gerarAlertas = useGerarAlertas();
  const gerarOportunidades = useGerarOportunidades();
  const gerarScore = useGerarScore();
  const gerarBriefing = useGerarBriefing();

  const clienteId = selectedClienteId;

  const run = async (fn: () => Promise<unknown>, label: string, count?: (r: unknown) => number) => {
    try {
      const r = await fn();
      const n = count ? count(r) : undefined;
      toast.success(n != null ? `${label}: ${n} gerado(s)` : `${label} concluído`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Falha ao ${label.toLowerCase()}`);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Inteligência Artificial</h2>
      </div>

      <Card>
        <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Cliente</Label>
            <Select value={clienteId ?? ""} onValueChange={(v) => setSelectedClienteId(v || null)}>
              <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
              <SelectContent>
                {(clientes ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!clienteId ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Selecione um cliente para importar a carteira e gerar insights.
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Importar carteira</CardTitle></CardHeader>
            <CardContent><ImportarCarteira clienteId={clienteId} /></CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Insights da IA</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="gap-2" disabled={gerarAlertas.isPending}
                  onClick={() => run(() => gerarAlertas.mutateAsync(clienteId), "Alertas", (r) => (Array.isArray(r) ? r.length : 0))}>
                  <Bell className="h-4 w-4" /> Gerar alertas
                </Button>
                <Button variant="outline" className="gap-2" disabled={gerarOportunidades.isPending}
                  onClick={() => run(() => gerarOportunidades.mutateAsync(clienteId), "Oportunidades", (r) => (Array.isArray(r) ? r.length : 0))}>
                  <Target className="h-4 w-4" /> Gerar oportunidades
                </Button>
                <Button variant="outline" className="gap-2" disabled={gerarScore.isPending}
                  onClick={() => run(() => gerarScore.mutateAsync(clienteId), "Score")}>
                  <Gauge className="h-4 w-4" /> Gerar score
                </Button>
                <Button variant="outline" className="gap-2" disabled={gerarBriefing.isPending}
                  onClick={async () => {
                    try {
                      const r = await gerarBriefing.mutateAsync(clienteId);
                      setBriefing(r.texto);
                      toast.success("Briefing gerado");
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Falha ao gerar briefing");
                    }
                  }}>
                  <FileText className="h-4 w-4" /> Gerar briefing
                </Button>
              </div>
              {briefing && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {briefing}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
