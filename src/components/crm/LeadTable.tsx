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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useCRM } from "@/context/CRMContext";
import { ORIGENS, ORIGEM_LABELS } from "@/lib/origemConstants";
import { cn } from "@/lib/utils";
import { Cadencia, Lead, Origem, Status, Temperatura } from "@/types/crm";
import { format } from "date-fns";
import {
  CalendarIcon,
  CheckCircle,
  Edit2,
  History,
  Loader2,
  MessageSquare,
  Phone,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { BriefingDialog } from "./BriefingDialog";
import { ConvertLeadDialog } from "./ConvertLeadDialog";
import { EditLeadDialog } from "./EditLeadDialog";
import { HistoricoDialog } from "./HistoricoDialog";
import { NewLeadDialog } from "./NewLeadDialog";
import { PrioridadeBadge, StatusBadge } from "./StatusBadge";

export const LeadTable = () => {
  const { leads, updateLead, deleteLead, registrarContato, loading, error } =
    useCRM();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [origemFilter, setOrigemFilter] = useState<Origem | "Todas">("Todas");
  const [statusFilter, setStatusFilter] = useState<Status | "Todas">("Todas");
  const [editingValue, setEditingValue] = useState<{
    leadId: string;
    field: "estimatedValueCents" | "statedValueCents";
    value: number | null;
  } | null>(null);
  const [savingValue, setSavingValue] = useState<string | null>(null);

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

  const activeLeads = useMemo(
    () => leads.filter((lead) => lead.status !== "Convertido"),
    [leads]
  );
  const filteredLeads = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return activeLeads.filter((lead) => {
      const matchesText =
        !term ||
        lead.nome.toLowerCase().includes(term) ||
        (lead.cidade && lead.cidade.toLowerCase().includes(term));
      const matchesOrigem =
        origemFilter === "Todas" || lead.origem === origemFilter;
      const matchesStatus =
        statusFilter === "Todas" || lead.status === statusFilter;
      return matchesText && matchesOrigem && matchesStatus;
    });
  }, [activeLeads, origemFilter, searchTerm, statusFilter]);
  const sortedLeads = useMemo(
    () => [...filteredLeads].sort((a, b) => b.score - a.score),
    [filteredLeads]
  );

  // Detectar quais colunas devem ser exibidas baseado nos leads visíveis
  const visibleColumns = useMemo(() => {
    if (sortedLeads.length === 0) {
      // Se não há leads, mostrar todas as colunas
      return {
        cidade: true,
        telefone: true,
        valor: true,
        codigo: true,
        proximoContato: true,
      };
    }

    return {
      cidade: sortedLeads.some(
        (lead) => lead.cidade && lead.cidade.trim().length > 0
      ),
      telefone: sortedLeads.some(
        (lead) => lead.telefone && lead.telefone.trim().length > 0
      ),
      valor:
        sortedLeads.some((lead) => lead.estimatedValueCents != null) ||
        sortedLeads.some((lead) => lead.statedValueCents != null),
      codigo: sortedLeads.some(
        (lead) => lead.codigo && lead.codigo.trim().length > 0
      ),
      proximoContato: sortedLeads.some((lead) => lead.proximoContato != null),
    };
  }, [sortedLeads]);

  const handleRegistrarContatoHoje = async (lead: Lead) => {
    try {
      await registrarContato(lead.id);
    } catch (err) {
      console.error("Erro ao registrar contato:", err);
    }
  };

  const handleValueEdit = (
    leadId: string,
    field: "estimatedValueCents" | "statedValueCents",
    currentValue: number | null
  ) => {
    setEditingValue({
      leadId,
      field,
      value: currentValue,
    });
  };

  const handleValueSave = async () => {
    if (!editingValue) return;

    try {
      setSavingValue(editingValue.leadId);
      await updateLead(editingValue.leadId, {
        [editingValue.field]: editingValue.value,
      });
      setEditingValue(null);
    } catch (err) {
      console.error("Erro ao atualizar valor:", err);
    } finally {
      setSavingValue(null);
    }
  };

  const handleValueCancel = () => {
    setEditingValue(null);
  };

  const handleValueChange = (value: number | null) => {
    if (!editingValue) return;
    setEditingValue({
      ...editingValue,
      value,
    });
  };

  if (loading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Carregando contatos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center space-y-2">
            <p className="text-destructive font-semibold">
              Erro ao carregar dados
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
        <CardTitle className="text-lg font-semibold">Contatos ativos</CardTitle>
        <NewLeadDialog />
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_1fr]">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou cidade"
            className="border-border/50 focus:border-primary focus:ring-primary/20 transition-colors"
          />
          <Select
            value={origemFilter}
            onValueChange={(v: Origem | "Todas") => setOrigemFilter(v)}
          >
            <SelectTrigger className="border-border/50 focus:border-primary focus:ring-primary/20 transition-colors">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              {ORIGENS.map((origem) => (
                <SelectItem key={origem} value={origem}>
                  {ORIGEM_LABELS[origem]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v: Status | "Todas") => setStatusFilter(v)}
          >
            <SelectTrigger className="border-border/50 focus:border-primary focus:ring-primary/20 transition-colors">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todos</SelectItem>
              <SelectItem value="Atrasado">Atrasado</SelectItem>
              <SelectItem value="Falar Hoje">Falar Hoje</SelectItem>
              <SelectItem value="Em Dia">Em Dia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto scrollbar-thin -mx-2 px-2">
            <Table className="min-w-[800px] md:min-w-[1000px] lg:min-w-[1200px]">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/50 transition-colors">
                  <TableHead className="font-semibold hidden lg:table-cell min-w-[100px]">
                    Prioridade
                  </TableHead>
                  <TableHead className="font-semibold min-w-[150px]">
                    Nome
                  </TableHead>
                  {visibleColumns.cidade && (
                    <TableHead className="font-semibold min-w-[120px]">
                      Cidade
                    </TableHead>
                  )}
                  <TableHead className="font-semibold hidden md:table-cell min-w-[100px]">
                    Origem
                  </TableHead>
                  {visibleColumns.telefone && (
                    <TableHead className="font-semibold min-w-[140px]">
                      Telefone
                    </TableHead>
                  )}
                  {visibleColumns.valor && (
                    <TableHead className="font-semibold hidden md:table-cell min-w-[110px]">
                      Valor
                    </TableHead>
                  )}
                  {visibleColumns.codigo && (
                    <TableHead className="font-semibold hidden xl:table-cell min-w-[120px] max-w-[150px]">
                      Código
                    </TableHead>
                  )}
                  <TableHead className="font-semibold hidden lg:table-cell min-w-[110px]">
                    Cadência
                  </TableHead>
                  <TableHead className="font-semibold hidden xl:table-cell min-w-[130px]">
                    Último contato
                  </TableHead>
                  {visibleColumns.proximoContato && (
                    <TableHead className="font-semibold hidden md:table-cell min-w-[130px]">
                      Próximo contato
                    </TableHead>
                  )}
                  <TableHead className="font-semibold min-w-[100px]">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold hidden md:table-cell min-w-[110px]">
                    Temperatura
                  </TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell min-w-[70px] text-center">
                    Score
                  </TableHead>
                  <TableHead className="font-semibold min-w-[140px] sticky right-0 bg-background">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="hover:bg-muted/40 transition-colors duration-150 border-b border-border/30"
                  >
                    <TableCell className="hidden lg:table-cell">
                      <PrioridadeBadge prioridade={lead.prioridade} />
                    </TableCell>
                    <TableCell className="font-medium">{lead.nome}</TableCell>
                    {visibleColumns.cidade &&
                      (lead.cidade ? (
                        <TableCell>{lead.cidade}</TableCell>
                      ) : (
                        <TableCell>
                          <span className="text-muted-foreground">N/A</span>
                        </TableCell>
                      ))}
                    <TableCell className="hidden md:table-cell">
                      <span className="metric-badge bg-muted text-muted-foreground">
                        {ORIGEM_LABELS[lead.origem as Origem] ?? lead.origem}
                      </span>
                    </TableCell>
                    {visibleColumns.telefone && (
                      <TableCell>
                        <a
                          href={`tel:${lead.telefone}`}
                          className="flex items-center gap-1 text-primary hover:underline whitespace-nowrap"
                        >
                          {lead.telefone && (
                            <>
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{lead.telefone}</span>
                            </>
                          )}
                          {!lead.telefone && (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </a>
                      </TableCell>
                    )}
                    {visibleColumns.valor && (
                      <TableCell className="hidden md:table-cell">
                        {editingValue?.leadId === lead.id &&
                        (editingValue.field === "estimatedValueCents" ||
                          editingValue.field === "statedValueCents") ? (
                          <div className="flex items-center gap-2 min-w-[150px]">
                            <CurrencyInput
                              value={editingValue.value}
                              onChange={handleValueChange}
                              className="h-8 flex-1"
                              placeholder="0,00"
                            />
                            <div className="flex items-center gap-1">
                              {savingValue === lead.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-primary hover:bg-primary/10"
                                    onClick={handleValueSave}
                                    title="Salvar"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:bg-muted"
                                    onClick={handleValueCancel}
                                    title="Cancelar"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div
                            className="flex items-center gap-2 group cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 transition-colors"
                            onClick={() =>
                              handleValueEdit(
                                lead.id,
                                lead.statedValueCents != null
                                  ? "statedValueCents"
                                  : "estimatedValueCents",
                                lead.statedValueCents ??
                                  lead.estimatedValueCents ??
                                  null
                              )
                            }
                            title="Clique para editar o valor"
                          >
                            <span className="whitespace-nowrap">
                              {formatCurrency(
                                lead.statedValueCents ??
                                  lead.estimatedValueCents,
                                lead.currency || "BRL"
                              )}
                            </span>
                            <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.codigo && (
                      <TableCell className="hidden xl:table-cell font-mono text-xs max-w-[150px]">
                        <span className="truncate block" title={lead.codigo}>
                          {lead.codigo ? lead.codigo : "N/A"}
                        </span>
                      </TableCell>
                    )}
                    <TableCell className="hidden lg:table-cell">
                      <Select
                        value={lead.cadencia}
                        onValueChange={async (v: Cadencia) => {
                          try {
                            await updateLead(lead.id, { cadencia: v });
                          } catch (err) {
                            console.error("Erro ao atualizar lead:", err);
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 min-w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Semanal">Semanal</SelectItem>
                          <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                          <SelectItem value="Mensal">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "justify-start text-left font-normal min-w-[120px]",
                              !lead.ultimoContato && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {lead.ultimoContato
                                ? format(lead.ultimoContato, "dd/MM/yyyy")
                                : "Selecione"}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={lead.ultimoContato || undefined}
                            onSelect={async (date) => {
                              try {
                                await updateLead(lead.id, {
                                  ultimoContato: date || null,
                                });
                              } catch (err) {
                                console.error("Erro ao atualizar lead:", err);
                              }
                            }}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    {visibleColumns.proximoContato && (
                      <TableCell className="hidden md:table-cell whitespace-nowrap">
                        {lead.proximoContato ? (
                          <span
                            className={cn(
                              "font-medium",
                              lead.status === "Atrasado" &&
                                "text-[hsl(var(--status-atrasado))]",
                              lead.status === "Falar Hoje" &&
                                "text-[hsl(var(--status-falar-hoje))]"
                            )}
                          >
                            {format(lead.proximoContato, "dd/MM/yyyy")}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <StatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Select
                        value={lead.temperatura}
                        onValueChange={async (v: Temperatura) => {
                          try {
                            await updateLead(lead.id, { temperatura: v });
                          } catch (err) {
                            console.error("Erro ao atualizar lead:", err);
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 min-w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Frio">Frio</SelectItem>
                          <SelectItem value="Morno">Morno</SelectItem>
                          <SelectItem value="Quente">Quente</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-center">
                      <span className="font-bold text-primary">
                        {lead.score}
                      </span>
                    </TableCell>
                    <TableCell className="sticky right-0 bg-background z-10 border-l border-border/30">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[hsl(var(--status-em-dia))] hover:bg-[hsl(var(--status-em-dia-bg))] hover:text-[hsl(var(--status-em-dia))] transition-colors"
                          onClick={() => handleRegistrarContatoHoje(lead)}
                          title="Registrar contato hoje"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowBriefing(true);
                          }}
                          title="Adicionar briefing"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-muted transition-colors"
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowHistorico(true);
                          }}
                          title="Ver histórico"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => {
                            setLeadToEdit(lead);
                            setShowEditDialog(true);
                          }}
                          title="Editar contato"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => {
                            setLeadToConvert(lead);
                            setShowConvertDialog(true);
                          }}
                          title="Converter contato"
                        >
                          <Trophy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={() => {
                            setLeadToDelete(lead);
                            setShowDeleteDialog(true);
                          }}
                          title="Excluir contato"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {selectedLead && (
          <>
            <BriefingDialog
              open={showBriefing}
              onOpenChange={setShowBriefing}
              lead={selectedLead}
            />
            <HistoricoDialog
              open={showHistorico}
              onOpenChange={setShowHistorico}
              lead={selectedLead}
            />
          </>
        )}

        {leadToEdit && (
          <EditLeadDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            lead={leadToEdit}
          />
        )}

        <ConvertLeadDialog
          lead={leadToConvert}
          open={showConvertDialog}
          onOpenChange={setShowConvertDialog}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o lead "{leadToDelete?.nome}"?
                Esta ação não pode ser desfeita.
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
      </CardContent>
    </Card>
  );
};
