import { KPICard } from "@/components/crm/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShareBar } from "@/components/sow/shared/ShareBar";
import { useAuth } from "@/context/AuthContext";
import { useSoW } from "@/context/SoWContext";
import { useSoWEquipe } from "@/hooks/sow/useSoW";
import { formatBRLCompacto, formatPct } from "@/lib/money";
import { Users, Wallet, Gauge, Target, ChevronRight } from "lucide-react";

/**
 * Visão de Liderança do SoW — o "clico em liderança e acesso a carteira de cada
 * um" que o CRM já tinha e aqui não existia.
 *
 * O módulo sempre soube recortar por assessor no backend, mas não havia tela que
 * PERGUNTASSE isso: o líder abria tudo fundido, a carteira dele misturada à do
 * time, sem nem saber de quem era cada cliente. Esta tabela é o índice, e o
 * clique na linha leva para a carteira daquele assessor (drill-down via
 * `assessorId`, que o backend valida contra quem o líder gerencia).
 *
 * Espelha components/crm/LeaderDashboard.tsx de propósito: é a mesma pergunta em
 * outro módulo, e a familiaridade vale mais que originalidade aqui.
 */
export default function EquipeView({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const { user } = useAuth();
  const { setAssessorId, setSelectedClienteId } = useSoW();
  const { data, isLoading, error } = useSoWEquipe();

  const abrirCarteira = (assessorId: string, nome: string) => {
    // O cliente selecionado é de outro escopo; carregar Clientes com ele preso
    // abriria o detalhe de um cliente que talvez nem esteja na nova lista.
    setSelectedClienteId(null);
    setAssessorId(assessorId, nome);
    onNavigate?.("clientes");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">
          Não foi possível carregar a equipe. Tente recarregar a página.
        </p>
      </div>
    );
  }

  const totals = data?.totals;
  const linhas = data?.breakdown ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Liderança</h2>
          <p className="text-[12px] text-muted-foreground">
            Carteira de cada assessor. Clique numa linha para abrir a carteira dele.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Assessores" value={String(totals?.assessores ?? 0)} icon={Users} />
        <KPICard title="Clientes" value={String(totals?.clientes ?? 0)} icon={Users} />
        <KPICard
          title="Patrimônio total"
          value={formatBRLCompacto(totals?.patrimonioTotal ?? 0)}
          icon={Wallet}
        />
        <KPICard
          title="Share da equipe"
          value={formatPct(totals?.sharePct ?? 0)}
          icon={Gauge}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Por assessor</CardTitle>
        </CardHeader>
        <CardContent>
          {linhas.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum assessor na sua equipe ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessor</TableHead>
                    <TableHead className="text-right">Clientes</TableHead>
                    <TableHead className="text-right">Patrimônio</TableHead>
                    <TableHead className="text-right">Na EQI</TableHead>
                    <TableHead className="min-w-[160px]">Share</TableHead>
                    <TableHead className="text-right">Gap</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((l) => (
                    <TableRow
                      key={l.assessorId}
                      onClick={() => abrirCarteira(l.assessorId, l.assessorNome)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-medium">
                        {l.assessorNome}
                        {l.assessorId === user?.id && (
                          <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            você
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{l.clientes}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRLCompacto(l.patrimonioTotal)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRLCompacto(l.patrimonioInterno)}
                      </TableCell>
                      <TableCell>
                        <ShareBar value={l.sharePct} meta={l.metaSharePct} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRLCompacto(l.gap)}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground">
        <Target className="mr-1 inline h-3 w-3" />
        Os números saem do mesmo cache de patrimônio do Dashboard — no mesmo escopo, os
        dois têm que bater.
      </p>
    </div>
  );
}
