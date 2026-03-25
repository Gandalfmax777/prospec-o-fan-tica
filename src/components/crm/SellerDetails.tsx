import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/services/api";
import { ORIGENS, ORIGEM_LABELS } from "@/lib/origemConstants";
import { SellerDetails as SellerDetailsType } from "@/types/api";
import { Origem, Status } from "@/types/crm";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Phone,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KPICard } from "./KPICard";
import { StatusBadge } from "./StatusBadge";

interface SellerDetailsProps {
  sellerId: string;
  onBack: () => void;
}

export const SellerDetails = ({ sellerId, onBack }: SellerDetailsProps) => {
  const [details, setDetails] = useState<SellerDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "Todas">("Todas");
  const [origemFilter, setOrigemFilter] = useState<Origem | "Todas">("Todas");
  const [cidadeFilter, setCidadeFilter] = useState<string>("Todas");

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await api.getSellerDetails(sellerId);
        setDetails(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao carregar detalhes";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [sellerId]);

  const formatCurrency = (value: number, currency = "BRL") =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
      value / 100
    );

  // Filtrar leads
  const filteredLeads = useMemo(() => {
    if (!details) return [];
    const term = searchTerm.trim().toLowerCase();
    const leads = details.leads.filter((lead) => {
      const matchesText =
        !term ||
        lead.nome.toLowerCase().includes(term) ||
        lead.cidade.toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "Todas" || lead.status === statusFilter;
      const matchesOrigem =
        origemFilter === "Todas" || lead.origem === origemFilter;
      const matchesCidade =
        cidadeFilter === "Todas" || lead.cidade === cidadeFilter;
      return matchesText && matchesStatus && matchesOrigem && matchesCidade;
    });
    return leads.sort((a, b) => {
      // Ordenar por data de entrada (mais recente primeiro)
      return (
        new Date(b.dataEntrada).getTime() - new Date(a.dataEntrada).getTime()
      );
    });
  }, [details, searchTerm, statusFilter, origemFilter, cidadeFilter]);

  // Obter lista única de cidades para o filtro
  const availableCities = useMemo(() => {
    if (!details) return [];
    const cities = new Set(
      details.leads
        .map((lead) => lead.cidade)
        .filter((city) => city && city.trim().length > 0) // Filtrar vazios
    );
    return Array.from(cities).sort();
  }, [details]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Erro ao carregar</h1>
            <p className="text-muted-foreground">
              {error || "Detalhes não encontrados"}
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {error || "Não foi possível carregar os detalhes do vendedor"}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { seller, metrics } = details;

  return (
    <div className="space-y-6">
      {/* Header com botão voltar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {seller.name || "Sem nome"}
              </h1>
              <Badge variant="secondary">{seller.role}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{seller.email}</p>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="Total de Leads"
          value={metrics.totalLeads}
          icon={Users}
          variant="default"
        />
        <KPICard
          title="Leads Convertidos"
          value={metrics.convertedLeads}
          icon={CheckCircle}
          variant="success"
        />
        <KPICard
          title="Taxa de Conversão"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
          variant="primary"
        />
        <KPICard
          title="Volume Informado"
          value={formatCurrency(metrics.totalStatedValueCents)}
          icon={DollarSign}
          variant="default"
        />
        <KPICard
          title="Volume Estimado"
          value={formatCurrency(metrics.totalEstimatedValueCents)}
          icon={DollarSign}
          variant="default"
        />
        <KPICard
          title="Base: Leads Totais"
          value={`${metrics.totalLeads} leads`}
          icon={BarChart3}
          variant="default"
        />
      </div>

      {/* Cards de Leads por Status */}
      <Card>
        <CardHeader>
          <CardTitle>Leads por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg hover:border-destructive/50 transition-colors">
              <div className="p-2 bg-destructive/10 text-destructive rounded-lg">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atrasado</p>
                <p className="text-2xl font-bold">
                  {metrics.leadsByStatus["Atrasado"] || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg hover:border-[hsl(var(--status-falar-hoje)/0.5)] transition-colors">
              <div className="p-2 bg-[hsl(var(--status-falar-hoje-bg))] text-[hsl(var(--status-falar-hoje))] rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Falar Hoje</p>
                <p className="text-2xl font-bold">
                  {metrics.leadsByStatus["Falar Hoje"] || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg hover:border-[hsl(var(--status-em-dia)/0.5)] transition-colors">
              <div className="p-2 bg-[hsl(var(--status-em-dia-bg))] text-[hsl(var(--status-em-dia))] rounded-lg">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Dia</p>
                <p className="text-2xl font-bold">
                  {metrics.leadsByStatus["Em Dia"] || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg hover:border-primary/30 transition-colors">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Convertido</p>
                <p className="text-2xl font-bold">
                  {metrics.leadsByStatus["Convertido"] || 0}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Leads ao Longo do Tempo */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ao Longo do Tempo (Últimos 30 dias)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {details.timelineData && details.timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={details.timelineData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("pt-BR");
                  }}
                  cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="leadsCount"
                  stroke="hsl(var(--primary))"
                  name="Leads"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="convertedCount"
                  stroke="hsl(var(--success))"
                  name="Convertidos"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Nenhum dado disponível para o período
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráficos de Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Origem */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Origem</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {metrics.leadsByOrigin && metrics.leadsByOrigin.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.leadsByOrigin}
                    dataKey="count"
                    nameKey="origin"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ origin, count }) => `${origin}: ${count}`}
                  >
                    {metrics.leadsByOrigin.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`hsl(var(--primary) / ${0.7 + index * 0.1})`}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição por Cadência */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Cadência</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {metrics.leadsByCadence && metrics.leadsByCadence.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.leadsByCadence}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis dataKey="cadence" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Cidades */}
      {metrics.leadsByCity && metrics.leadsByCity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Cidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.leadsByCity.slice(0, 10)}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="city"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funil de Conversão */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div>
                <p className="text-sm text-muted-foreground">Total de Leads</p>
                <p className="text-2xl font-bold">{metrics.totalLeads}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center justify-center">
              <div className="w-1 h-8 bg-muted"></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-[hsl(var(--warning)/0.1)] rounded-lg border border-[hsl(var(--warning)/0.2)]">
              <div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">
                  {metrics.leadsByStatus["Atrasado"] +
                    metrics.leadsByStatus["Falar Hoje"] +
                    metrics.leadsByStatus["Em Dia"] || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-[hsl(var(--warning))]" />
            </div>
            <div className="flex items-center justify-center">
              <div className="w-1 h-8 bg-muted"></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-[hsl(var(--success)/0.1)] rounded-lg border border-[hsl(var(--success)/0.2)]">
              <div>
                <p className="text-sm text-muted-foreground">Convertidos</p>
                <p className="text-2xl font-bold">{metrics.convertedLeads}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-[hsl(var(--success))]" />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Taxa de Conversão:{" "}
                <span className="font-bold text-primary">
                  {metrics.conversionRate.toFixed(1)}%
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Leads do Vendedor */}
      <Card>
        <CardHeader>
          <CardTitle>Leads do Vendedor ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Input
              placeholder="Buscar por nome ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as Status | "Todas")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas os Status</SelectItem>
                <SelectItem value="Atrasado">Atrasado</SelectItem>
                <SelectItem value="Falar Hoje">Falar Hoje</SelectItem>
                <SelectItem value="Em Dia">Em Dia</SelectItem>
                <SelectItem value="Convertido">Convertido</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={origemFilter}
              onValueChange={(value) =>
                setOrigemFilter(value as Origem | "Todas")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as Origens</SelectItem>
                {ORIGENS.map((o) => (
                  <SelectItem key={o} value={o}>{ORIGEM_LABELS[o]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={cidadeFilter}
              onValueChange={(value) => setCidadeFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as Cidades</SelectItem>
                {availableCities
                  .filter((city) => city && city.trim().length > 0) // Verificação adicional
                  .map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="min-w-[150px]">Nome</TableHead>
                  <TableHead className="min-w-[120px]">Cidade</TableHead>
                  <TableHead className="min-w-[120px]">Origem</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[130px]">
                    Valor Informado
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    Data de Entrada
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    Último Contato
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum lead encontrado com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium">{lead.nome}</TableCell>
                      <TableCell>{lead.cidade}</TableCell>
                      <TableCell>{lead.origem}</TableCell>
                      <TableCell>
                        <StatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell>
                        {formatCurrency(lead.statedValueCents || 0)}
                      </TableCell>
                      <TableCell>
                        {lead.dataEntrada
                          ? format(new Date(lead.dataEntrada), "dd/MM/yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {lead.ultimoContato
                          ? format(new Date(lead.ultimoContato), "dd/MM/yyyy")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Timeline de Atividades Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {details.recentActivity && details.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {details.recentActivity.map((activity, index) => {
                const date = new Date(activity.date);
                const getActivityIcon = () => {
                  switch (activity.type) {
                    case "contact":
                      return <Phone className="h-4 w-4" />;
                    case "briefing":
                      return <FileText className="h-4 w-4" />;
                    case "conversion":
                      return <CheckCircle className="h-4 w-4" />;
                    default:
                      return <Clock className="h-4 w-4" />;
                  }
                };

                const getActivityColor = () => {
                  switch (activity.type) {
                    case "contact":
                      return "bg-primary/10 text-primary border-primary/20";
                    case "briefing":
                      return "bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400";
                    case "conversion":
                      return "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.2)]";
                    default:
                      return "bg-muted text-muted-foreground border-border";
                  }
                };

                return (
                  <div
                    key={index}
                    className="flex gap-4 relative pb-4 last:pb-0"
                  >
                    {/* Linha vertical */}
                    {index < details.recentActivity.length - 1 && (
                      <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border" />
                    )}
                    {/* Ícone */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 ${getActivityColor()}`}
                    >
                      {getActivityIcon()}
                    </div>
                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                        <p className="font-medium text-sm truncate">
                          {activity.leadName}
                        </p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(date, "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground break-words">
                        {activity.description}
                      </p>
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {activity.type === "contact" && "Contato"}
                          {activity.type === "briefing" && "Briefing"}
                          {activity.type === "conversion" && "Conversão"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma atividade recente encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
