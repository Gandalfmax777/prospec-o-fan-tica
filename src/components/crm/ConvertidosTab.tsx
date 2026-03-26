import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCRM } from "@/context/CRMContext";
import { Cadencia, Lead, Origem } from "@/types/crm";
import { ORIGENS } from "@/lib/origemConstants";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import {
  ArrowUpRight,
  CheckCircle,
  Edit,
  ExternalLink,
  Loader2,
  MapPin,
  RotateCcw,
  Save,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KPICard } from "./KPICard";

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

export const ConvertidosTab = () => {
  const { leads, updateLead, deleteLead, retornarAoFunil, transferLead } = useCRM();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Lead>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [transferringId, setTransferringId] = useState<string | null>(null);

  const convertidos = leads.filter((lead) => lead.status === "Convertido");

  const conversaoPorCadencia = ["Semanal", "Quinzenal", "Mensal"].map(
    (cadencia) => ({
      cadencia,
      quantidade: convertidos.filter((lead) => lead.cadencia === cadencia)
        .length,
    })
  );

  const conversaoPorCidade = convertidos
    .reduce((acc, lead) => {
      const existing = acc.find((cidade) => cidade.cidade === lead.cidade);
      if (existing) {
        existing.quantidade++;
      } else {
        acc.push({ cidade: lead.cidade, quantidade: 1 });
      }
      return acc;
    }, [] as { cidade: string; quantidade: number }[])
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 6);

  const parseCurrencyToCents = (value: string) => {
    const normalized = value
      .replace(/[^\d.,-]/g, "")
      .replace(",", ".")
      .trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    if (Number.isNaN(parsed)) return null;
    return Math.round(parsed * 100);
  };

  const formatCentsForInput = (value: number | null | undefined) => {
    if (value == null) return "";
    return (value / 100).toFixed(2).replace(".", ",");
  };

  const formatCurrency = (
    value: number | null | undefined,
    currency = "BRL"
  ) => {
    if (value == null) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(value / 100);
  };

  const handleEdit = (lead: Lead) => {
    setEditingId(lead.id);
    setEditData(lead);
  };

  const handleSave = async () => {
    if (editingId && editData) {
      try {
        await updateLead(editingId, editData);
        setEditingId(null);
        setEditData({});
      } catch (err) {
        console.error("Erro ao atualizar lead:", err);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleTransfer = async (lead: Lead) => {
    try {
      setTransferringId(lead.id);
      await transferLead(lead.id);
      toast({
        title: "Contato transferido!",
        description: `${lead.nome} foi enviado ao CRM com sucesso.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao transferir contato";
      toast({ title: "Erro ao transferir", description: message, variant: "destructive" });
    } finally {
      setTransferringId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>Leads convertidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <KPICard
              title="Total convertidos"
              value={convertidos.length}
              icon={CheckCircle}
              variant="success"
            />
            <KPICard
              title="Taxa de conversao"
              value={`${
                leads.length > 0
                  ? ((convertidos.length / leads.length) * 100).toFixed(1)
                  : 0
              }%`}
              icon={TrendingUp}
              variant="primary"
            />
            <KPICard
              title="Cidades atendidas"
              value={new Set(convertidos.map((lead) => lead.cidade)).size}
              icon={MapPin}
              variant="default"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conversao por cadencia</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] md:h-[250px] lg:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={conversaoPorCadencia}
                  dataKey="quantidade"
                  nameKey="cadencia"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label={({ cadencia, quantidade }) =>
                    `${cadencia}: ${quantidade}`
                  }
                >
                  {conversaoPorCadencia.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversao por cidade</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] md:h-[250px] lg:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversaoPorCidade}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis dataKey="cidade" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="quantidade"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de convertidos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nome</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Valor estimado</TableHead>
                  <TableHead>Valor informado</TableHead>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Cadencia</TableHead>
                  <TableHead>Ultimo contato</TableHead>
                  <TableHead>Data conversao</TableHead>
                  <TableHead>Observacao</TableHead>
                  <TableHead>CRM</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {convertidos.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      {editingId === lead.id ? (
                        <Input
                          value={editData.nome || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, nome: e.target.value })
                          }
                          className="h-8"
                        />
                      ) : (
                        <span className="font-medium">{lead.nome}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === lead.id ? (
                        <Input
                          value={editData.cidade || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, cidade: e.target.value })
                          }
                          className="h-8"
                        />
                      ) : (
                        lead.cidade
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === lead.id ? (
                        <Select
                          value={editData.origem}
                          onValueChange={(v: Origem) =>
                            setEditData({ ...editData, origem: v })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORIGENS.map((origem) => (
                              <SelectItem key={origem} value={origem}>
                                {origem}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="metric-badge bg-muted text-muted-foreground">
                          {lead.origem}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === lead.id ? (
                        <Input
                          value={editData.telefone || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              telefone: e.target.value,
                            })
                          }
                          className="h-8"
                        />
                      ) : (
                        lead.telefone
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === lead.id ? (
                        <CurrencyInput
                          value={editData.estimatedValueCents ?? null}
                          onChange={(estimatedValueCents) =>
                            setEditData({
                              ...editData,
                              estimatedValueCents,
                              currency: "BRL",
                            })
                          }
                          className="h-8"
                        />
                      ) : (
                        formatCurrency(lead.estimatedValueCents, lead.currency)
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === lead.id ? (
                        <CurrencyInput
                          value={editData.statedValueCents ?? null}
                          onChange={(statedValueCents) =>
                            setEditData({
                              ...editData,
                              statedValueCents,
                              currency: "BRL",
                            })
                          }
                          className="h-8"
                        />
                      ) : (
                        formatCurrency(lead.statedValueCents, lead.currency)
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {lead.codigo}
                    </TableCell>
                    <TableCell>
                      {editingId === lead.id ? (
                        <Select
                          value={editData.cadencia}
                          onValueChange={(v: Cadencia) =>
                            setEditData({ ...editData, cadencia: v })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Semanal">Semanal</SelectItem>
                            <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                            <SelectItem value="Mensal">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        lead.cadencia
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.ultimoContato
                        ? format(lead.ultimoContato, "dd/MM/yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {lead.dataConversao
                        ? format(lead.dataConversao, "dd/MM/yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {editingId === lead.id ? (
                        <Input
                          value={editData.observacao || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              observacao: e.target.value,
                            })
                          }
                          className="h-8"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {lead.observacao || "-"}
                        </span>
                      )}
                    </TableCell>
                    {/* CRM status cell */}
                    <TableCell>
                      {lead.crmDealId ? (
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs whitespace-nowrap"
                          >
                            Transferido
                          </Badge>
                          {lead.crmDealUrl && (
                            <a
                              href={lead.crmDealUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver no CRM"
                              className="text-primary hover:text-primary/80 transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground text-xs whitespace-nowrap"
                        >
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {editingId === lead.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[hsl(var(--status-em-dia))]"
                              onClick={handleSave}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={handleCancel}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(lead)}
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {/* Botão de transferência para o CRM */}
                            {!lead.crmDealId && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400"
                                onClick={() => handleTransfer(lead)}
                                disabled={transferringId === lead.id}
                                title="Enviar este contato ao CRM"
                              >
                                {transferringId === lead.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                )}
                                Enviar ao CRM
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary"
                              onClick={async () => {
                                try {
                                  await retornarAoFunil(lead.id);
                                } catch (err) {
                                  console.error(
                                    "Erro ao retornar ao funil:",
                                    err
                                  );
                                }
                              }}
                              title="Retornar ao funil"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => {
                                setLeadToDelete(lead);
                                setShowDeleteDialog(true);
                              }}
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {convertidos.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={13}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum lead convertido ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contato "{leadToDelete?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (leadToDelete) {
                  try {
                    await deleteLead(leadToDelete.id);
                    setShowDeleteDialog(false);
                    setLeadToDelete(null);
                  } catch (err) {
                    console.error("Erro ao deletar lead:", err);
                  }
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
