import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useCRM } from "@/context/CRMContext";
import { Origem, PerdidoLead } from "@/types/crm";
import { ORIGEM_LABELS } from "@/lib/origemConstants";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye,
  FileDown,
  HandHelping,
  Loader2,
  Phone,
  Trash2,
  UserX,
} from "lucide-react";

export const PerdidosTab = () => {
  const { user } = useAuth();
  const { refreshData } = useCRM();
  const isAdmin = user?.role === "ADMIN";

  const [perdidos, setPerdidos] = useState<PerdidoLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [assumindoId, setAssumindoId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<PerdidoLead | null>(null);
  const [briefingLead, setBriefingLead] = useState<PerdidoLead | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPerdidos();
      setPerdidos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar perdidos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return perdidos;
    return perdidos.filter(
      (p) =>
        p.nome.toLowerCase().includes(t) ||
        (p.cidade && p.cidade.toLowerCase().includes(t)) ||
        p.ownerName.toLowerCase().includes(t)
    );
  }, [perdidos, search]);

  const handleAssumir = async (p: PerdidoLead) => {
    try {
      setAssumindoId(p.id);
      await api.assumirLead(p.id);
      toast({
        title: "Lead assumido!",
        description: `"${p.nome}" voltou ao funil como seu contato ativo.`,
      });
      setPerdidos((prev) => prev.filter((x) => x.id !== p.id));
      await refreshData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao assumir o lead";
      toast({
        title: "Não foi possível assumir",
        description: msg,
        variant: "destructive",
      });
      // Pode ter sido assumido por outro assessor (409) — recarrega o pool.
      await load();
    } finally {
      setAssumindoId(null);
    }
  };

  const handleDelete = async () => {
    if (!leadToDelete) return;
    try {
      await api.deleteLead(leadToDelete.id);
      setPerdidos((prev) => prev.filter((x) => x.id !== leadToDelete.id));
      toast({
        title: "Lead excluído",
        description: `"${leadToDelete.nome}" foi removido do banco de perdidos.`,
      });
      setLeadToDelete(null);
    } catch (err) {
      toast({
        title: "Erro ao excluir",
        description: err instanceof Error ? err.message : "Erro ao excluir o lead.",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await api.exportPerdidosPdf();
    } catch (err) {
      toast({
        title: "Erro ao gerar PDF",
        description: err instanceof Error ? err.message : "Erro ao gerar o PDF.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Carregando perdidos...</p>
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
            <p className="text-destructive font-semibold">Erro ao carregar dados</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={load} className="mt-2">
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-col gap-3 pb-3 border-b border-border/50 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <UserX className="h-5 w-5 text-[hsl(var(--status-perdido))]" />
            Banco de perdidos
            <Badge variant="secondary" className="ml-1">
              {perdidos.length}
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Leads perdidos de toda a equipe. Assuma um para tentar reconquistá-lo.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exporting || perdidos.length === 0}
          className="gap-2"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          Gerar PDF
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, cidade ou assessor"
          className="border-border/50 focus:border-primary focus:ring-primary/20 transition-colors max-w-md"
        />

        <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto scrollbar-thin -mx-2 px-2">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/50 transition-colors">
                  <TableHead className="font-semibold min-w-[150px]">Nome</TableHead>
                  <TableHead className="font-semibold min-w-[160px]">Contato</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell min-w-[100px]">
                    Origem
                  </TableHead>
                  <TableHead className="font-semibold min-w-[140px]">Dono atual</TableHead>
                  <TableHead className="font-semibold min-w-[160px]">Motivo</TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell min-w-[110px]">
                    Perdido em
                  </TableHead>
                  <TableHead className="font-semibold min-w-[160px] sticky right-0 bg-background">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow
                    key={p.id}
                    className="hover:bg-muted/40 transition-colors duration-150 border-b border-border/30"
                  >
                    <TableCell className="font-medium">
                      {p.nome}
                      {p.cidade && (
                        <span className="block text-xs text-muted-foreground">
                          {p.cidade}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.telefone ? (
                        <a
                          href={`tel:${p.telefone}`}
                          className="flex items-center gap-1 text-primary hover:underline whitespace-nowrap"
                        >
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{p.telefone}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {p.email || "N/A"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="metric-badge bg-muted text-muted-foreground">
                        {ORIGEM_LABELS[p.origem as Origem] ?? p.origem}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={p.isOwner ? "font-medium text-primary" : ""}
                      >
                        {p.isOwner ? "Você" : p.ownerName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm line-clamp-2">
                        {p.motivoPerda || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell whitespace-nowrap text-sm">
                      {p.dataPerda ? format(p.dataPerda, "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell className="sticky right-0 bg-background z-10 border-l border-border/30">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-muted transition-colors"
                          onClick={() => setBriefingLead(p)}
                          title="Ver briefing e contato"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/40"
                          onClick={() => handleAssumir(p)}
                          disabled={assumindoId === p.id}
                          title="Assumir este lead e trazê-lo de volta ao seu funil"
                        >
                          {assumindoId === p.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <HandHelping className="w-3.5 h-3.5" />
                          )}
                          Assumir
                        </Button>
                        {(p.isOwner || isAdmin) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() => setLeadToDelete(p)}
                            title="Excluir definitivamente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-muted-foreground"
                    >
                      {perdidos.length === 0
                        ? "Nenhum lead perdido no momento."
                        : "Nenhum resultado para a busca."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      {/* Diálogo de briefing / detalhes de contato */}
      <Dialog
        open={!!briefingLead}
        onOpenChange={(o) => !o && setBriefingLead(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{briefingLead?.nome}</DialogTitle>
            <DialogDescription>
              Informações de contato e último briefing registrado.
            </DialogDescription>
          </DialogHeader>
          {briefingLead && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground">Telefone</p>
                  <p className="font-medium">{briefingLead.telefone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">E-mail</p>
                  <p className="font-medium break-all">
                    {briefingLead.email || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cidade</p>
                  <p className="font-medium">{briefingLead.cidade || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Código</p>
                  <p className="font-medium">{briefingLead.codigo || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dono atual</p>
                  <p className="font-medium">{briefingLead.ownerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Motivo da perda</p>
                  <p className="font-medium">{briefingLead.motivoPerda || "—"}</p>
                </div>
              </div>
              {briefingLead.observacao && (
                <div>
                  <p className="text-muted-foreground">Observação</p>
                  <p className="font-medium">{briefingLead.observacao}</p>
                </div>
              )}
              <div className="border-t border-border/50 pt-3">
                <p className="font-semibold mb-1">Último briefing</p>
                {briefingLead.ultimoBriefing ? (
                  <div className="space-y-1 text-muted-foreground">
                    {briefingLead.ultimoBriefing.objetivo && (
                      <p>
                        <span className="font-medium text-foreground">
                          Objetivo:
                        </span>{" "}
                        {briefingLead.ultimoBriefing.objetivo}
                      </p>
                    )}
                    {briefingLead.ultimoBriefing.resultado && (
                      <p>
                        <span className="font-medium text-foreground">
                          Resultado:
                        </span>{" "}
                        {briefingLead.ultimoBriefing.resultado}
                      </p>
                    )}
                    {briefingLead.ultimoBriefing.objecoes && (
                      <p>
                        <span className="font-medium text-foreground">
                          Objeções:
                        </span>{" "}
                        {briefingLead.ultimoBriefing.objecoes}
                      </p>
                    )}
                    {briefingLead.ultimoBriefing.proximoPasso && (
                      <p>
                        <span className="font-medium text-foreground">
                          Próximo passo:
                        </span>{" "}
                        {briefingLead.ultimoBriefing.proximoPasso}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Nenhum briefing registrado.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={!!leadToDelete}
        onOpenChange={(o) => !o && setLeadToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir definitivamente o lead "
              {leadToDelete?.nome}" do banco de perdidos? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
