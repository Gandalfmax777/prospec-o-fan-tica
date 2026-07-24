import { Fragment } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatBRLCompacto } from "@/lib/money";
import type { SoWImportJob } from "@/types/sow";
import { CheckCircle2, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Shapes tolerantes — o resultado vem como `unknown` do backend.
interface ParsedAtivo {
  nome?: string | null;
  tipo?: string | null;
  valorAplicado?: number | null;
  vencimento?: string | null;
}
interface ParsedInstituicao {
  nome?: string | null;
  ativos?: ParsedAtivo[] | null;
}
interface ParsedCarteira {
  instituicoes?: ParsedInstituicao[] | null;
  observacoes?: string | null;
}
/** O backend grava { instituicoesCriadas, ativosCriados, carteira } (routes/sow/ai.js). */
interface ParsedResultado {
  instituicoesCriadas?: number | null;
  ativosCriados?: number | null;
  ativosSubstituidos?: number | null;
  carteira?: ParsedCarteira | null;
}

function fmtVencimento(v?: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

export function ImportReview({ job }: { job: SoWImportJob }) {
  const resultado = (job.resultado ?? {}) as ParsedResultado;
  const carteira = resultado.carteira ?? {};
  const instituicoes = Array.isArray(carteira.instituicoes) ? carteira.instituicoes : [];

  // Contadores vêm do writer: `instituicoesCriadas` conta só as novas, então
  // pode ser menor que a lista abaixo quando a instituição já existia.
  const instCriadas = resultado.instituicoesCriadas ?? 0;
  const ativosCriados = resultado.ativosCriados ?? 0;
  const substituidos = resultado.ativosSubstituidos ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-lg border border-[hsl(142_71%_42%/0.4)] bg-[hsl(142_71%_42%/0.06)] p-3">
        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[hsl(142_71%_40%)]" />
        <div>
          <p className="text-sm font-medium text-foreground">
            {ativosCriados} ativo{ativosCriados === 1 ? "" : "s"} criado
            {ativosCriados === 1 ? "" : "s"}
            {instCriadas > 0 && (
              <>
                {" "}
                em {instCriadas} nova{instCriadas === 1 ? "" : "s"} instituiç
                {instCriadas === 1 ? "ão" : "ões"}
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Os dados já foram adicionados à carteira do cliente.
            {substituidos > 0 && (
              <>
                {" "}
                {substituidos} ativo{substituidos === 1 ? "" : "s"} de importações anteriores
                {substituidos === 1 ? " foi substituído" : " foram substituídos"}.
              </>
            )}
          </p>
        </div>
      </div>

      {carteira.observacoes && (
        <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-3">
          {carteira.observacoes}
        </p>
      )}

      {instituicoes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          A IA não identificou instituições ou ativos neste arquivo.
        </p>
      ) : (
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Ativo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor aplicado</TableHead>
                  <TableHead>Vencimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instituicoes.map((inst, i) => {
                  const ativos = Array.isArray(inst.ativos) ? inst.ativos : [];
                  return (
                    <Fragment key={`inst-${i}`}>
                      <TableRow className="bg-muted/25 hover:bg-muted/25">
                        <TableCell colSpan={4} className="py-2">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                            <Building2 className="h-3.5 w-3.5 text-primary" />
                            {inst.nome || "Instituição sem nome"}
                            <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">
                              {ativos.length} ativo{ativos.length === 1 ? "" : "s"}
                            </Badge>
                          </span>
                        </TableCell>
                      </TableRow>
                      {ativos.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-xs text-muted-foreground py-2 pl-8"
                          >
                            Nenhum ativo identificado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        ativos.map((ativo, j) => (
                          <TableRow key={`inst-${i}-ativo-${j}`}>
                            <TableCell className="pl-8 text-sm">
                              {ativo.nome || "—"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {ativo.tipo || "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm">
                              {formatBRLCompacto(ativo.valorAplicado ?? 0)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {fmtVencimento(ativo.vencimento)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
