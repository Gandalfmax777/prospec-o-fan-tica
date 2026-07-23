import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateInstituicao, useSoWCatalogo } from "@/hooks/sow/useSoW";
import { parseBRL } from "@/lib/money";
import { toast } from "sonner";

const CUSTOM = "custom";

export function NovaInstituicaoDialog({
  clienteId,
  open,
  onOpenChange,
}: {
  clienteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: catalogo } = useSoWCatalogo();
  const { mutate, isPending } = useCreateInstituicao(clienteId);

  const [catalogoId, setCatalogoId] = useState<string>("");
  const [nome, setNome] = useState("");
  const [interna, setInterna] = useState(false);
  const [valorInformado, setValorInformado] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (!open) {
      setCatalogoId("");
      setNome("");
      setInterna(false);
      setValorInformado("");
      setResponsavel("");
      setObservacoes("");
    }
  }, [open]);

  const isCustom = catalogoId === "" || catalogoId === CUSTOM;

  const handleSelectCatalogo = (v: string) => {
    setCatalogoId(v);
    if (v === CUSTOM) {
      setNome("");
      setInterna(false);
    } else {
      const entry = (catalogo ?? []).find((c) => c.id === v);
      if (entry) {
        setNome(entry.nome);
        setInterna(entry.interna);
      }
    }
  };

  const handleSubmit = () => {
    if (!nome.trim()) {
      toast.error("Informe o nome da instituição.");
      return;
    }
    mutate(
      {
        nome: nome.trim(),
        catalogoId: catalogoId && catalogoId !== CUSTOM ? catalogoId : null,
        interna,
        valorInformado: valorInformado.trim() ? parseBRL(valorInformado) : null,
        responsavel: responsavel.trim() || null,
        observacoes: observacoes.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Instituição adicionada!");
          onOpenChange(false);
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Erro ao adicionar instituição."),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova instituição</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Do catálogo</Label>
            <Select value={catalogoId || undefined} onValueChange={handleSelectCatalogo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione ou digite abaixo" />
              </SelectTrigger>
              <SelectContent>
                {(catalogo ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                    {c.interna ? " · interna" : ""}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM}>Outra (digitar)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome da instituição"
                disabled={!isCustom}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valor informado (R$)</Label>
              <Input
                value={valorInformado}
                onChange={(e) => setValorInformado(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Input
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Responsável / assessor"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
              <Label className="cursor-pointer">Própria instituição</Label>
              <Switch checked={interna} onCheckedChange={setInterna} disabled={!isCustom} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Salvando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
