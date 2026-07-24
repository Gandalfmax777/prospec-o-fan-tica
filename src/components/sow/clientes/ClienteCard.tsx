import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareBar } from "@/components/sow/shared/ShareBar";
import { ScoreBadge } from "@/components/sow/shared/ScoreBadge";
import { formatBRLCompacto, formatPct } from "@/lib/money";
import type { SoWCliente, SoWClienteStatus } from "@/types/sow";
import { format, parseISO } from "date-fns";

const STATUS_TONE: Record<SoWClienteStatus, string> = {
  Prospect: "bg-muted text-muted-foreground",
  Ativo: "bg-primary/10 text-primary",
  "Em Negociação": "bg-[hsl(38_92%_50%/0.12)] text-[hsl(38_92%_40%)]",
  Convertido:
    "bg-[hsl(142_71%_42%/0.12)] text-[hsl(142_71%_36%)] dark:text-[hsl(142_71%_55%)]",
  Inativo: "bg-muted text-muted-foreground",
  Perdido: "bg-destructive/10 text-destructive",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "dd/MM/yyyy");
  } catch {
    return "—";
  }
}

export function ClienteCard({
  cliente,
  onClick,
}: {
  cliente: SoWCliente;
  onClick?: () => void;
}) {
  const proximoVencimento = useMemo(() => {
    const ativos = cliente.ativos ?? [];
    const now = Date.now();
    const futuros = ativos
      .map((a) => a.vencimento)
      .filter((v): v is string => !!v)
      .map((v) => {
        try {
          return parseISO(v);
        } catch {
          return null;
        }
      })
      .filter((d): d is Date => d != null && d.getTime() >= now)
      .sort((a, b) => a.getTime() - b.getTime());
    return futuros[0] ? format(futuros[0], "dd/MM/yyyy") : "—";
  }, [cliente.ativos]);

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold truncate">{cliente.nome}</CardTitle>
          {cliente.cidade && (
            <p className="text-xs text-muted-foreground truncate">{cliente.cidade}</p>
          )}
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[cliente.status] ?? "bg-muted text-muted-foreground"}`}
        >
          {cliente.status}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md bg-muted/40 p-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {formatBRLCompacto(cliente.patrimonioTotal)}
            </p>
          </div>
          <div className="rounded-md bg-muted/40 p-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">EQI</p>
            <p className="text-sm font-semibold text-[hsl(142_71%_36%)] dark:text-[hsl(142_71%_55%)] tabular-nums">
              {formatBRLCompacto(cliente.patrimonioInterno)}
            </p>
          </div>
          <div className="rounded-md bg-muted/40 p-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Externo</p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {formatBRLCompacto(cliente.patrimonioExterno)}
            </p>
          </div>
        </div>

        <ShareBar value={cliente.sharePct} meta={cliente.metaSharePct} />

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Gap{" "}
            <strong className="font-semibold text-destructive tabular-nums">
              {formatBRLCompacto(cliente.gap)}
            </strong>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Score</span>
            <ScoreBadge score={cliente.scoreValor} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
          <span>
            Último contato:{" "}
            <span className="text-foreground">{fmtDate(cliente.ultimoContato)}</span>
          </span>
          <span>
            Próx. vencimento: <span className="text-foreground">{proximoVencimento}</span>
          </span>
          <span>
            Concentração:{" "}
            <span className="text-foreground">
              {cliente.probabilidadeConcentracao != null
                ? formatPct(cliente.probabilidadeConcentracao)
                : "—"}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
