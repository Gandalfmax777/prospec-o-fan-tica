import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSoWAlertas, useUpdateAlerta } from "@/hooks/sow/useSoW";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, Check } from "lucide-react";
import type { SoWSeveridade } from "@/types/sow";

const TODAS = "__todas__";

const tone: Record<SoWSeveridade, string> = {
  Crítica: "border-destructive/40 bg-destructive/5",
  Alta: "border-destructive/30 bg-destructive/5",
  Média: "border-[hsl(38_92%_50%/0.4)] bg-[hsl(38_92%_50%/0.06)]",
  Baixa: "border-border bg-muted/30",
};
const sevBadge: Record<SoWSeveridade, string> = {
  Crítica: "bg-destructive/10 text-destructive",
  Alta: "bg-destructive/10 text-destructive",
  Média: "bg-[hsl(38_92%_50%/0.12)] text-[hsl(38_92%_40%)]",
  Baixa: "bg-muted text-muted-foreground",
};

export default function AlertasView({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const [severidade, setSeveridade] = useState<string>(TODAS);
  const [mostrarResolvidos, setMostrarResolvidos] = useState(false);

  const { data, isLoading } = useSoWAlertas({
    severidade: severidade === TODAS ? undefined : severidade,
    resolvido: mostrarResolvidos ? undefined : false,
  });
  const updateAlerta = useUpdateAlerta();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 mr-auto">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Alertas Inteligentes</h2>
        </div>
        <Select value={severidade} onValueChange={setSeveridade}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Toda severidade</SelectItem>
            <SelectItem value="Crítica">Crítica</SelectItem>
            <SelectItem value="Alta">Alta</SelectItem>
            <SelectItem value="Média">Média</SelectItem>
            <SelectItem value="Baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch id="resolvidos" checked={mostrarResolvidos} onCheckedChange={setMostrarResolvidos} />
          <Label htmlFor="resolvidos" className="text-sm text-muted-foreground">Mostrar resolvidos</Label>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      ) : !data || data.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhum alerta — gere pela aba IA de um cliente.
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((a) => (
            <div
              key={a.id}
              className={cn("rounded-lg border p-4 flex items-start gap-3 cursor-pointer", tone[a.severidade] ?? tone.Baixa, a.resolvido && "opacity-60")}
              onClick={() => onNavigate?.("clientes")}
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={cn("border-0", sevBadge[a.severidade])}>{a.severidade}</Badge>
                  <span className="text-xs font-medium text-muted-foreground">{a.tipo}</span>
                  {a.clienteNome && <span className="text-xs text-foreground font-semibold">· {a.clienteNome}</span>}
                </div>
                <p className="text-sm text-foreground">{a.mensagem}</p>
                <p className="text-[11px] text-muted-foreground">{format(new Date(a.createdAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}</p>
              </div>
              {!a.resolvido && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 shrink-0"
                  onClick={(e) => { e.stopPropagation(); updateAlerta.mutate({ id: a.id, resolvido: true }); }}
                >
                  <Check className="h-3.5 w-3.5" /> Resolver
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
