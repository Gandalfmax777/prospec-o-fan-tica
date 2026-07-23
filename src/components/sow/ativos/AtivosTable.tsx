import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSoWAtivosCliente, useDeleteAtivo } from "@/hooks/sow/useSoW";
import { formatBRLExato } from "@/lib/money";
import type { SoWAtivo, SoWAtivoStatus } from "@/types/sow";
import { format, parseISO } from "date-fns";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AtivoFormDialog } from "./AtivoFormDialog";

const STATUS_TONE: Record<SoWAtivoStatus, string> = {
  Ativo: "bg-[hsl(142_71%_42%/0.12)] text-[hsl(142_71%_36%)] dark:text-[hsl(142_71%_55%)]",
  Resgatado: "bg-muted text-muted-foreground",
  Vencido: "bg-destructive/10 text-destructive",
  "Em Movimentação": "bg-[hsl(38_92%_50%/0.12)] text-[hsl(38_92%_40%)]",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "dd/MM/yyyy");
  } catch {
    return "—";
  }
}

export function AtivosTable({
  clienteId,
  instituicaoId,
}: {
  clienteId: string;
  instituicaoId?: string;
}) {
  const { data, isLoading } = useSoWAtivosCliente(clienteId);
  const deleteAtivo = useDeleteAtivo();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SoWAtivo | undefined>(undefined);
  const [toDelete, setToDelete] = useState<SoWAtivo | null>(null);

  const ativos = useMemo(() => {
    const list = data ?? [];
    return instituicaoId ? list.filter((a) => a.instituicaoId === instituicaoId) : list;
  }, [data, instituicaoId]);

  const openNew = () => {
    setEditing(undefined);
    setShowForm(true);
  };
  const openEdit = (a: SoWAtivo) => {
    setEditing(a);
    setShowForm(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Ativos</h3>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo ativo
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Tipo</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Valor aplicado</TableHead>
              <TableHead>Rentabilidade</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Liquidez</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : ativos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum ativo cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              ativos.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <span className="metric-badge bg-muted text-muted-foreground">{a.tipo}</span>
                  </TableCell>
                  <TableCell className="font-medium">{a.nome}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRLExato(a.valorAplicado)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {a.rentabilidade || "—"}
                  </TableCell>
                  <TableCell className="text-sm">{fmtDate(a.vencimento)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {a.liquidez || "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[a.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {a.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(a)}
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setToDelete(a)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showForm && (
        <AtivoFormDialog
          clienteId={clienteId}
          instituicaoId={instituicaoId}
          ativo={editing}
          open={showForm}
          onOpenChange={setShowForm}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ativo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{toDelete?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!toDelete) return;
                deleteAtivo.mutate(toDelete.id, {
                  onSuccess: () => {
                    toast.success("Ativo excluído.");
                    setToDelete(null);
                  },
                  onError: (err) =>
                    toast.error(err instanceof Error ? err.message : "Erro ao excluir ativo."),
                });
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
