/**
 * Análise de carteira gerada por IA — botão e card.
 *
 * Dois exports, e não um componente só, para preservar os dois layouts que já
 * existiam: em ClienteDetail o botão vive na linha com os outros três geradores
 * e o card fica separado, abaixo. As duas partes leem a MESMA query (o React
 * Query deduplica) e só o botão é dono da mutation.
 */
import { format, parseISO } from "date-fns";
import { AlertTriangle, FileText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "@/components/sow/shared/Markdown";
import { useAnaliseCarteira, useAnalisarCarteira } from "@/hooks/sow/useSoW";

/**
 * Botão de gerar. O rótulo muda quando já existe análise salva: "Analisar
 * carteira" promete uma primeira leitura, e com um relatório na tela o assessor
 * precisa saber que o clique vai cobrar OUTRA geração de Opus (~60s).
 */
export function AnaliseCarteiraBotao({ clienteId }: { clienteId: string }) {
  const { data: analise } = useAnaliseCarteira(clienteId);
  const analisar = useAnalisarCarteira();

  return (
    <Button
      disabled={analisar.isPending}
      onClick={() =>
        analisar.mutate(clienteId, {
          onSuccess: (r) =>
            toast.success(
              r.ativosComentados > 0
                ? `Carteira analisada — ${r.ativosComentados} ativo(s) comentados.`
                : "Carteira analisada!"
            ),
          onError: (err) =>
            toast.error(
              err instanceof Error ? err.message : "Erro ao analisar a carteira."
            ),
        })
      }
    >
      {analisar.isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      {analise ? "Gerar nova análise" : "Analisar carteira"}
    </Button>
  );
}

/** O relatório salvo. Some quando não há nenhum — nada de placeholder vazio. */
export function AnaliseCarteiraCard({ clienteId }: { clienteId: string }) {
  const { data: analise } = useAnaliseCarteira(clienteId);
  if (!analise) return null;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-foreground">
          <FileText className="h-4 w-4 text-primary" />
          Análise da carteira
          <span className="text-xs font-normal text-muted-foreground">
            gerada em {format(parseISO(analise.geradaEm), "dd/MM/yyyy 'às' HH:mm")}
          </span>
        </div>

        {/*
          Âmbar, não `destructive`: nada quebrou, o relatório só envelheceu. E a
          análise antiga NUNCA é apagada automaticamente — apagar ressuscitaria
          exatamente a reclamação que esta feature resolve ("toda vez tem que
          gerar de novo"). O rótulo do botão acima já oferece a saída.
        */}
        {analise.desatualizada && (
          <div className="flex items-start gap-2 rounded-md border border-[hsl(38_92%_50%/0.3)] bg-[hsl(38_92%_50%/0.08)] px-3 py-2 text-xs text-[hsl(38_92%_35%)] dark:text-[hsl(38_92%_60%)]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              A carteira mudou depois desta análise — os valores e percentuais
              abaixo podem estar defasados. O texto continua aqui como registro;
              gere uma nova antes de usar na conversa.
            </span>
          </div>
        )}

        <Markdown>{analise.texto}</Markdown>
      </CardContent>
    </Card>
  );
}
