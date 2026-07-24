import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { ShareBar } from "@/components/sow/shared/ShareBar";
import { UrgenciaBadge } from "@/components/sow/shared/UrgenciaBadge";
import {
  useSoWOportunidades,
  useUpdateOportunidade,
  useDeleteOportunidade,
} from "@/hooks/sow/useSoW";
import { formatBRLCompacto } from "@/lib/money";
import { FollowUpDialog } from "./FollowUpDialog";
import type { SoWOportunidade } from "@/types/sow";
import { toast } from "sonner";
import { MessageSquarePlus, Target, Trash2 } from "lucide-react";

const TODAS = "__todas__";

export default function OportunidadesView() {
  const [status, setStatus] = useState<string>(TODAS);
  const [urgencia, setUrgencia] = useState<string>(TODAS);
  const [followUp, setFollowUp] = useState<SoWOportunidade | null>(null);
  const [toDelete, setToDelete] = useState<SoWOportunidade | null>(null);

  const { data, isLoading } = useSoWOportunidades({
    status: status === TODAS ? undefined : status,
    urgencia: urgencia === TODAS ? undefined : urgencia,
  });
  const updateOpp = useUpdateOportunidade();
  const deleteOpp = useDeleteOportunidade();

  const setStatusOpp = (id: string, novo: string) => {
    updateOpp.mutate(
      { id, body: { status: novo } },
      { onSuccess: () => toast.success(`Oportunidade marcada como ${novo}`) }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 mr-auto">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Centro de Oportunidades</h2>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todos os status</SelectItem>
            <SelectItem value="Aberta">Aberta</SelectItem>
            <SelectItem value="Em Negociação">Em Negociação</SelectItem>
            <SelectItem value="Ganha">Ganha</SelectItem>
            <SelectItem value="Perdida">Perdida</SelectItem>
            <SelectItem value="Descartada">Descartada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={urgencia} onValueChange={setUrgencia}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Urgência" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Toda urgência</SelectItem>
            <SelectItem value="Alta">Alta</SelectItem>
            <SelectItem value="Média">Média</SelectItem>
            <SelectItem value="Baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : !data || data.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhuma oportunidade — gere pela aba IA de um cliente.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Ativo / Instituição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[130px]">Chance</TableHead>
                  <TableHead>Urgência</TableHead>
                  <TableHead className="text-center">Dias</TableHead>
                  <TableHead>Sugestão IA</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((o) => {
                  const terminal = ["Ganha", "Perdida", "Descartada"].includes(o.status);
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.clienteNome ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {[o.ativoId ? "Ativo" : null, o.instituicao].filter(Boolean).join(" · ") || "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRLCompacto(o.valor ?? 0)}</TableCell>
                      <TableCell><ShareBar value={o.chancePct ?? 0} showLabel /></TableCell>
                      <TableCell><UrgenciaBadge urgencia={o.urgencia} /></TableCell>
                      <TableCell className={`text-center tabular-nums ${o.diasRestantes != null && o.diasRestantes <= 15 ? "text-destructive font-semibold" : ""}`}>
                        {o.diasRestantes ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-sm" title={o.sugestaoIA ?? ""}>
                        {o.sugestaoIA ?? "—"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => setFollowUp(o)}>
                          <MessageSquarePlus className="h-3.5 w-3.5" /> Follow-up
                        </Button>
                        {terminal ? (
                          <Badge variant="secondary" className="ml-1">{o.status}</Badge>
                        ) : (
                          <>
                            <Button variant="ghost" size="sm" className="h-8 text-[hsl(142_71%_36%)]" onClick={() => setStatusOpp(o.id, "Ganha")}>Ganha</Button>
                            <Button variant="ghost" size="sm" className="h-8 text-destructive" onClick={() => setStatusOpp(o.id, "Perdida")}>Perdida</Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-1 h-8 w-8 text-destructive"
                          onClick={() => setToDelete(o)}
                          title="Excluir oportunidade"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {followUp && (
        <FollowUpDialog oportunidade={followUp} open={!!followUp} onOpenChange={(v) => !v && setFollowUp(null)} />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir oportunidade</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir a oportunidade de {toDelete?.clienteNome ?? "este cliente"}
              {toDelete?.valor != null ? ` (${formatBRLCompacto(toDelete.valor)})` : ""}? Ela sai do
              valor em negociação. Se o negócio apenas não avançou, prefira marcar como Perdida para
              manter o histórico. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteOpp.isPending}
              onClick={() => {
                if (!toDelete) return;
                deleteOpp.mutate(toDelete.id, {
                  onSuccess: () => {
                    toast.success("Oportunidade excluída.");
                    setToDelete(null);
                  },
                  onError: (err) =>
                    toast.error(
                      err instanceof Error ? err.message : "Erro ao excluir oportunidade."
                    ),
                });
              }}
            >
              {deleteOpp.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
