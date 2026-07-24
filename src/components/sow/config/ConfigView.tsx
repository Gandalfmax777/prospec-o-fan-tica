import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAuth } from "@/context/AuthContext";
import {
  useSoWCatalogo,
  useUpdateCatalogo,
  useCreateCatalogo,
  useDeleteCatalogo,
} from "@/hooks/sow/useSoW";
import type { SoWInstituicaoCatalogo } from "@/types/sow";
import { Settings, Plus, Building2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ConfigView() {
  const { data: catalogo, isLoading } = useSoWCatalogo();
  const updateCat = useUpdateCatalogo();
  const createCat = useCreateCatalogo();
  const deleteCat = useDeleteCatalogo();
  const { user } = useAuth();
  // O backend restringe a remoção do catálogo a ADMIN — não mostrar o que vai dar 403.
  const isAdmin = user?.role === "ADMIN";
  const [nova, setNova] = useState("");
  const [novaInterna, setNovaInterna] = useState(false);
  const [toDelete, setToDelete] = useState<SoWInstituicaoCatalogo | null>(null);

  const adicionar = () => {
    if (!nova.trim()) return;
    createCat.mutate(
      { nome: nova.trim(), interna: novaInterna },
      {
        onSuccess: () => { toast.success("Instituição adicionada"); setNova(""); setNovaInterna(false); },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao adicionar"),
      }
    );
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Configurações</h2>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Catálogo de instituições</CardTitle>
          <p className="text-sm text-muted-foreground">
            Marque como <strong>da casa</strong> as custódias da sua corretora — é isso que define o
            Patrimônio na EQI vs externo. Ativos sob instituições da casa entram no Share; os demais
            contam como patrimônio externo (captável). A meta de share é definida no cadastro de cada
            cliente.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-2 border-b border-border pb-4">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nova instituição</Label>
              <Input value={nova} onChange={(e) => setNova(e.target.value)} placeholder="Ex.: EQI" onKeyDown={(e) => e.key === "Enter" && adicionar()} />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Switch id="nova-interna" checked={novaInterna} onCheckedChange={setNovaInterna} />
              <Label htmlFor="nova-interna" className="text-sm text-muted-foreground">Da casa</Label>
            </div>
            <Button onClick={adicionar} disabled={createCat.isPending || !nova.trim()} className="gap-1">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
          ) : (catalogo ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Catálogo vazio.</p>
          ) : (
            <div className="divide-y divide-border">
              {(catalogo ?? []).map((c) => (
                <div key={c.id} className="flex items-center gap-4 py-2.5">
                  <span className="flex-1 text-sm font-medium">{c.nome}</span>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`int-${c.id}`} className="text-xs text-muted-foreground">Da casa</Label>
                    <Switch
                      id={`int-${c.id}`}
                      checked={c.interna}
                      onCheckedChange={(v) => updateCat.mutate({ id: c.id, body: { interna: v } })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`atv-${c.id}`} className="text-xs text-muted-foreground">Ativa</Label>
                    <Switch
                      id={`atv-${c.id}`}
                      checked={c.ativo}
                      onCheckedChange={(v) => updateCat.mutate({ id: c.id, body: { ativo: v } })}
                    />
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setToDelete(c)}
                      title="Remover do catálogo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover do catálogo</AlertDialogTitle>
            <AlertDialogDescription>
              Remover "{toDelete?.nome}" do catálogo da organização? As instituições já cadastradas
              nos clientes <strong>não são excluídas</strong> — elas apenas deixam de ficar
              vinculadas a esta entrada, e o patrimônio delas continua igual. Se a intenção é só
              tirar da lista de opções, desligue "Ativa" em vez de remover.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCat.isPending}
              onClick={() => {
                if (!toDelete) return;
                deleteCat.mutate(toDelete.id, {
                  onSuccess: () => {
                    toast.success("Instituição removida do catálogo.");
                    setToDelete(null);
                  },
                  onError: (e) =>
                    toast.error(e instanceof Error ? e.message : "Falha ao remover do catálogo."),
                });
              }}
            >
              {deleteCat.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
