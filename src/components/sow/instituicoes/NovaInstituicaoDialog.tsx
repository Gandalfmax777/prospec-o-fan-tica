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
import {
  useCreateInstituicao,
  useUpdateInstituicao,
  useSoWCatalogo,
} from "@/hooks/sow/useSoW";
import { parseBRL } from "@/lib/money";
import type { SoWInstituicao } from "@/types/sow";
import { toast } from "sonner";

const CUSTOM = "custom";

export function NovaInstituicaoDialog({
  clienteId,
  instituicao,
  open,
  onOpenChange,
}: {
  clienteId: string;
  /** Presente = modo edição. Ausente = criação. */
  instituicao?: SoWInstituicao;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: catalogo } = useSoWCatalogo();
  const createInstituicao = useCreateInstituicao(clienteId);
  const updateInstituicao = useUpdateInstituicao();

  const isEdit = !!instituicao;
  const isPending = createInstituicao.isPending || updateInstituicao.isPending;

  const [catalogoId, setCatalogoId] = useState<string>("");
  const [nome, setNome] = useState("");
  const [interna, setInterna] = useState(false);
  const [valorInformado, setValorInformado] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (instituicao) {
      setCatalogoId("");
      setNome(instituicao.nome);
      setInterna(instituicao.interna);
      setValorInformado(
        instituicao.valorInformado != null ? String(instituicao.valorInformado) : ""
      );
      setResponsavel(instituicao.responsavel ?? "");
      setObservacoes(instituicao.observacoes ?? "");
    } else {
      setCatalogoId("");
      setNome("");
      setInterna(false);
      setValorInformado("");
      setResponsavel("");
      setObservacoes("");
    }
  }, [open, instituicao]);

  // Na criação, escolher do catálogo trava nome e `interna` (vêm do catálogo).
  // Na edição não há catálogo: tudo é editável — é assim que se corrige uma
  // instituição cadastrada como externa por engano.
  const isCustom = catalogoId === "" || catalogoId === CUSTOM;
  const camposTravados = !isEdit && !isCustom;

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
    const body = {
      nome: nome.trim(),
      interna,
      valorInformado: valorInformado.trim() ? parseBRL(valorInformado) : null,
      responsavel: responsavel.trim() || null,
      observacoes: observacoes.trim() || null,
    };

    if (isEdit && instituicao) {
      updateInstituicao.mutate(
        { id: instituicao.id, body },
        {
          onSuccess: () => {
            toast.success("Instituição atualizada!");
            onOpenChange(false);
          },
          onError: (err) =>
            toast.error(err instanceof Error ? err.message : "Erro ao atualizar instituição."),
        }
      );
      return;
    }

    createInstituicao.mutate(
      { ...body, catalogoId: catalogoId && catalogoId !== CUSTOM ? catalogoId : null },
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
          <DialogTitle>{isEdit ? "Editar instituição" : "Nova instituição"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!isEdit && (
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
                      {c.interna ? " · da casa" : ""}
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM}>Outra (digitar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome da instituição"
                disabled={camposTravados}
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
              {/* Campo de referência de extrato — não entra em nenhuma métrica.
                  Sem esse aviso o usuário digita o saldo aqui e o dashboard não muda. */}
              <p className="text-xs text-muted-foreground">
                Só referência do extrato. O patrimônio vem dos ativos cadastrados.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Input
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Responsável / assessor"
              />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-md border border-border/50 px-3 py-2.5">
            <div className="min-w-0">
              <Label className="cursor-pointer">Instituição da casa (conta como EQI)</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ativos cadastrados aqui entram no Patrimônio na EQI e no cálculo do Share.
                Deixe desligado para custódias externas.
              </p>
            </div>
            <Switch
              checked={interna}
              onCheckedChange={setInterna}
              disabled={camposTravados}
              className="mt-1 shrink-0"
            />
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
            {isPending ? "Salvando..." : isEdit ? "Salvar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
