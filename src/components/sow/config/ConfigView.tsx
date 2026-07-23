import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useSoWCatalogo, useUpdateCatalogo, useCreateCatalogo } from "@/hooks/sow/useSoW";
import { Settings, Plus, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function ConfigView() {
  const { data: catalogo, isLoading } = useSoWCatalogo();
  const updateCat = useUpdateCatalogo();
  const createCat = useCreateCatalogo();
  const [nova, setNova] = useState("");
  const [novaInterna, setNovaInterna] = useState(false);

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
            Marque como <strong>própria instituição</strong> as custódias da sua casa — é isso que define o
            Patrimônio interno (na EQI) vs externo. A meta de share é definida no cadastro de cada cliente.
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
              <Label htmlFor="nova-interna" className="text-sm text-muted-foreground">Própria</Label>
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
                    <Label htmlFor={`int-${c.id}`} className="text-xs text-muted-foreground">Própria</Label>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
