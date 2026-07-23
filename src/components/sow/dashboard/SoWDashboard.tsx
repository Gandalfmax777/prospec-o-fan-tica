import { KPICard } from "@/components/crm/KPICard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSoWDashboard } from "@/hooks/sow/useSoW";
import { formatBRLCompacto, formatPct } from "@/lib/money";
import { ShareEvolutionChart } from "./ShareEvolutionChart";
import {
  Wallet,
  Building2,
  Globe,
  PieChart,
  Target,
  TrendingDown,
  Users,
  Eye,
  Magnet,
  Handshake,
  CheckCircle2,
  Gauge,
} from "lucide-react";

export default function SoWDashboard({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const { data, isLoading, error } = useSoWDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-lg" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Não foi possível carregar o dashboard.
      </div>
    );
  }

  const cards: Array<{ title: string; value: string; icon: typeof Wallet; variant?: "default" | "primary" | "success" | "warning" | "danger" }> = [
    { title: "Patrimônio Total", value: formatBRLCompacto(data.patrimonioTotal), icon: Wallet, variant: "primary" },
    { title: "Patrimônio na EQI", value: formatBRLCompacto(data.patrimonioInterno), icon: Building2, variant: "success" },
    { title: "Patrimônio Externo", value: formatBRLCompacto(data.patrimonioExterno), icon: Globe, variant: "warning" },
    { title: "Share Atual", value: formatPct(data.shareAtualPct), icon: PieChart, variant: "primary" },
    { title: "Meta de Share", value: formatPct(data.metaSharePct), icon: Target },
    { title: "Gap Financeiro", value: formatBRLCompacto(data.gap), icon: TrendingDown, variant: "danger" },
    { title: "Nº de Clientes", value: String(data.numClientes), icon: Users },
    { title: "Patrimônio Monitorado", value: formatBRLCompacto(data.patrimonioMonitorado), icon: Eye },
    { title: "Patrimônio Captável", value: formatBRLCompacto(data.patrimonioCaptavel), icon: Magnet, variant: "warning" },
    { title: "Em Negociação", value: formatBRLCompacto(data.patrimonioEmNegociacao), icon: Handshake, variant: "primary" },
    { title: "Valor Convertido", value: formatBRLCompacto(data.valorConvertido), icon: CheckCircle2, variant: "success" },
    { title: "Taxa Média de Share", value: formatPct(data.taxaMediaSharePct), icon: Gauge },
  ];

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
          {cards.map((c) => (
            <div key={c.title} className="min-w-[150px]">
              <KPICard title={c.title} value={c.value} icon={c.icon} variant={c.variant} />
            </div>
          ))}
        </div>
      </div>

      <ShareEvolutionChart data={data.evolucaoMensal} />

      {onNavigate && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate("clientes")}
            className="text-[13px] font-medium text-primary hover:underline"
          >
            Ver clientes →
          </button>
          <button
            onClick={() => onNavigate("oportunidades")}
            className="text-[13px] font-medium text-primary hover:underline ml-4"
          >
            Centro de oportunidades →
          </button>
        </div>
      )}
    </div>
  );
}
