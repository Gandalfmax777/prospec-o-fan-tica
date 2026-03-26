import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { AdminUser, LeaderSummary, LeaderTeamMember } from "@/types/api";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, Users, TrendingUp, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeaderDashboardProps {
  onSellerClick?: (sellerId: string) => void;
}

export const LeaderDashboard = ({ onSellerClick }: LeaderDashboardProps) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [summary, setSummary] = useState<LeaderSummary | null>(null);
  const [team, setTeam] = useState<LeaderTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [userEdits, setUserEdits] = useState<Record<string, { role: string; managerId: string | null }>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        setLoading(true);
        setAdminError(null);
        setAdminLoading(isAdmin);

        const [summaryData, teamData, adminData] = await Promise.all([
          api.getLeaderSummary(),
          api.getLeaderTeam(),
          isAdmin ? api.getAdminUsers() : Promise.resolve([]),
        ]);

        setSummary(summaryData);
        setTeam(teamData);
        setAdminUsers(adminData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao carregar dados";
        setError(errorMessage);
        if (isAdmin) {
          setAdminError(errorMessage);
        }
      } finally {
        setLoading(false);
        setAdminLoading(false);
      }
    };

    loadData();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const nextEdits = Object.fromEntries(
      adminUsers.map((adminUser) => [
        adminUser.id,
        {
          role: adminUser.role,
          managerId: adminUser.managerId ?? null,
        },
      ])
    );
    setUserEdits(nextEdits);
  }, [adminUsers, isAdmin]);

  const formatCurrency = (value: number, currency = "BRL") =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value / 100);

  const totals = summary?.totals;
  const chartData = useMemo(
    () =>
      summary?.breakdown.map((row) => ({
        sellerName: row.sellerName,
        totalStatedValueCents: row.totalStatedValueCents,
      })) ?? [],
    [summary]
  );
  const chartTotal = chartData.reduce(
    (acc, item) => acc + (item.totalStatedValueCents ?? 0),
    0
  );

  const managerOptions = useMemo(
    () => adminUsers.filter((adminUser) => adminUser.role === "LEADER" || adminUser.role === "ADMIN"),
    [adminUsers]
  );

  const handleRoleChange = (userId: string, role: string) => {
    setUserEdits((prev) => ({
      ...prev,
      [userId]: {
        role,
        managerId: role === "SELLER" ? prev[userId]?.managerId ?? null : null,
      },
    }));
  };

  const handleManagerChange = (userId: string, managerId: string) => {
    setUserEdits((prev) => ({
      ...prev,
      [userId]: {
        role: prev[userId]?.role ?? "SELLER",
        managerId: managerId === "none" ? null : managerId,
      },
    }));
  };

  const handleSaveUser = async (userId: string) => {
    const edit = userEdits[userId];
    if (!edit) return;

    setSavingUserId(userId);
    setAdminError(null);

    try {
      const updated = await api.updateUserRole(userId, {
        role: edit.role,
        managerId: edit.role === "SELLER" ? edit.managerId ?? null : null,
      });

      setAdminUsers((prev) => prev.map((item) => (item.id === userId ? updated : item)));
      setUserEdits((prev) => ({
        ...prev,
        [userId]: { role: updated.role, managerId: updated.managerId ?? null },
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar usuario";
      setAdminError(errorMessage);
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Leads do time</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-3xl font-bold">{totals?.leadsCount ?? 0}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Convertidos: {loading ? "..." : totals?.convertedCount ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Taxa de conversao</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-3xl font-bold">
                {totals && totals.leadsCount > 0
                  ? `${((totals.convertedCount / totals.leadsCount) * 100).toFixed(1)}%`
                  : "0%"}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Base: {loading ? "..." : totals?.leadsCount ?? 0} leads
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>Volume informado</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-3xl font-bold">
                {formatCurrency(totals?.totalStatedValueCents ?? 0)}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Estimado: {loading ? "..." : formatCurrency(totals?.totalEstimatedValueCents ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Volume por prospector</CardTitle>
          {error && <span className="text-sm text-destructive">{error}</span>}
        </CardHeader>
        <CardContent className="h-[250px] md:h-[280px]">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-5/6" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          ) : chartData.length === 0 || chartTotal === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Nenhum valor informado para o periodo.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="sellerName" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(value) => formatCurrency(value).replace("R$\u00a0", "")} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                />
                <Bar dataKey="totalStatedValueCents" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
        {!loading && chartTotal === 0 && (
          <p className="px-6 pb-6 text-xs text-muted-foreground">
            O grafico usa o valor informado do lead. Preencha o campo "Valor informado" para ver o volume.
          </p>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipe</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Prospector</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Convertidos</TableHead>
                  <TableHead>Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6">
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ) : team.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum prospector associado.
                    </TableCell>
                  </TableRow>
                ) : (
                  team.map((member) => {
                    const sellerMetrics = summary?.breakdown.find((row) => row.sellerId === member.id);
                    return (
                      <TableRow 
                        key={member.id}
                        className={onSellerClick ? "cursor-pointer hover:bg-muted/50 transition-colors group" : ""}
                        onClick={() => onSellerClick?.(member.id)}
                      >
                        <TableCell className="font-medium">
                          {onSellerClick ? (
                            <div className="flex items-center gap-2">
                              <span className="group-hover:text-primary transition-colors">
                                {member.name || "Sem nome"}
                              </span>
                              <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                                Ver detalhes →
                              </span>
                            </div>
                          ) : (
                            member.name || "Sem nome"
                          )}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{sellerMetrics?.leadsCount ?? 0}</TableCell>
                        <TableCell>{sellerMetrics?.convertedCount ?? 0}</TableCell>
                        <TableCell>{formatCurrency(sellerMetrics?.totalStatedValueCents ?? 0)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>Gestao de usuarios</CardTitle>
            </div>
            {adminError && <span className="text-sm text-destructive">{adminError}</span>}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Defina o cargo e, para prospectors, selecione um líder responsável.
            </p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Lider</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6">
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : adminUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum usuario encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    adminUsers.map((adminUser) => {
                      const edit = userEdits[adminUser.id] ?? {
                        role: adminUser.role,
                        managerId: adminUser.managerId ?? null,
                      };

                      const hasChanges =
                        edit.role !== adminUser.role ||
                        (edit.managerId ?? null) !== (adminUser.managerId ?? null);

                      return (
                        <TableRow key={adminUser.id}>
                          <TableCell className="font-medium">{adminUser.name || "Sem nome"}</TableCell>
                          <TableCell>{adminUser.email}</TableCell>
                          <TableCell>
                            <Select value={edit.role} onValueChange={(value) => handleRoleChange(adminUser.id, value)}>
                              <SelectTrigger className="h-9 min-w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SELLER">SELLER</SelectItem>
                                <SelectItem value="LEADER">LEADER</SelectItem>
                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {edit.role === "SELLER" ? (
                              <Select
                                value={edit.managerId ?? "none"}
                                onValueChange={(value) => handleManagerChange(adminUser.id, value)}
                              >
                                <SelectTrigger className="h-9 min-w-[180px]">
                                  <SelectValue placeholder="Sem lider" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Sem lider</SelectItem>
                                  {managerOptions.map((manager) => (
                                    <SelectItem key={manager.id} value={manager.id}>
                                      {manager.name || manager.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!hasChanges || savingUserId === adminUser.id}
                              onClick={() => handleSaveUser(adminUser.id)}
                            >
                              {savingUserId === adminUser.id ? "Salvando..." : "Salvar"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
