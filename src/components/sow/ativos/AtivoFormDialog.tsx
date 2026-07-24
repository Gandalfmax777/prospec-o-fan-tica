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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateAtivo,
  useUpdateAtivo,
  useSoWInstituicoes,
} from "@/hooks/sow/useSoW";
import { parseBRL } from "@/lib/money";
import { cn } from "@/lib/utils";
import type {
  SoWAtivo,
  SoWAtivoStatus,
  SoWTipoAtivo,
  CreateAtivoInput,
} from "@/types/sow";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

const TIPOS: SoWTipoAtivo[] = [
  "CDB",
  "LCA",
  "LCI",
  "Debênture",
  "Tesouro",
  "Fundo",
  "Fundo Imobiliário",
  "Ação",
  "COE",
  "Previdência",
  "Renda Fixa Internacional",
  "Cripto",
  "Poupança",
  "Outros",
];

const STATUS: SoWAtivoStatus[] = ["Ativo", "Resgatado", "Vencido", "Em Movimentação"];

function safeParse(iso: string | null): Date | undefined {
  if (!iso) return undefined;
  try {
    return parseISO(iso);
  } catch {
    return undefined;
  }
}

export function AtivoFormDialog({
  clienteId,
  instituicaoId,
  ativo,
  open,
  onOpenChange,
}: {
  clienteId: string;
  instituicaoId?: string;
  ativo?: SoWAtivo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createAtivo = useCreateAtivo();
  const updateAtivo = useUpdateAtivo();
  // Também na edição: mover um ativo de instituição é como se corrige um ativo
  // lançado na custódia errada (e é o que faz ele passar a contar como EQI).
  const { data: instituicoes } = useSoWInstituicoes(!instituicaoId ? clienteId : null);

  const [instId, setInstId] = useState<string>(instituicaoId ?? "");
  const [tipo, setTipo] = useState<SoWTipoAtivo>("CDB");
  const [nome, setNome] = useState("");
  const [valorAplicado, setValorAplicado] = useState("");
  const [rentabilidade, setRentabilidade] = useState("");
  const [dataAplicacao, setDataAplicacao] = useState<Date | undefined>(undefined);
  const [vencimento, setVencimento] = useState<Date | undefined>(undefined);
  const [liquidez, setLiquidez] = useState("");
  const [custodia, setCustodia] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [status, setStatus] = useState<SoWAtivoStatus>("Ativo");

  useEffect(() => {
    if (!open) return;
    if (ativo) {
      setInstId(ativo.instituicaoId);
      setTipo(ativo.tipo);
      setNome(ativo.nome);
      setValorAplicado(String(ativo.valorAplicado));
      setRentabilidade(ativo.rentabilidade ?? "");
      setDataAplicacao(safeParse(ativo.dataAplicacao));
      setVencimento(safeParse(ativo.vencimento));
      setLiquidez(ativo.liquidez ?? "");
      setCustodia(ativo.custodia ?? "");
      setObservacoes(ativo.observacoes ?? "");
      setStatus(ativo.status);
    } else {
      setInstId(instituicaoId ?? "");
      setTipo("CDB");
      setNome("");
      setValorAplicado("");
      setRentabilidade("");
      setDataAplicacao(undefined);
      setVencimento(undefined);
      setLiquidez("");
      setCustodia("");
      setObservacoes("");
      setStatus("Ativo");
    }
  }, [open, ativo, instituicaoId]);

  const isEdit = !!ativo;
  const isPending = createAtivo.isPending || updateAtivo.isPending;

  const handleSubmit = () => {
    if (!nome.trim()) {
      toast.error("O nome do ativo é obrigatório.");
      return;
    }
    const targetInst = instituicaoId ?? instId;
    if (!targetInst) {
      toast.error("Selecione uma instituição.");
      return;
    }

    const body: CreateAtivoInput = {
      tipo,
      nome: nome.trim(),
      valorAplicado: parseBRL(valorAplicado),
      rentabilidade: rentabilidade.trim() || null,
      dataAplicacao: dataAplicacao ? dataAplicacao.toISOString() : null,
      vencimento: vencimento ? vencimento.toISOString() : null,
      liquidez: liquidez.trim() || null,
      custodia: custodia.trim() || null,
      observacoes: observacoes.trim() || null,
      status,
    };

    if (isEdit && ativo) {
      updateAtivo.mutate(
        {
          id: ativo.id,
          // Só manda instituicaoId quando realmente mudou — o backend valida que a
          // instituição de destino é do mesmo cliente.
          body: targetInst !== ativo.instituicaoId ? { ...body, instituicaoId: targetInst } : body,
        },
        {
          onSuccess: () => {
            toast.success("Ativo atualizado!");
            onOpenChange(false);
          },
          onError: (err) =>
            toast.error(err instanceof Error ? err.message : "Erro ao atualizar ativo."),
        }
      );
    } else {
      createAtivo.mutate(
        { instituicaoId: targetInst, body },
        {
          onSuccess: () => {
            toast.success("Ativo criado!");
            onOpenChange(false);
          },
          onError: (err) =>
            toast.error(err instanceof Error ? err.message : "Erro ao criar ativo."),
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar ativo" : "Novo ativo"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          {!instituicaoId && (
            <div className="col-span-2 space-y-1.5">
              <Label>
                Instituição <span className="text-destructive">*</span>
              </Label>
              {(instituicoes ?? []).length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
                  Este cliente ainda não tem instituições. Cadastre uma na aba{" "}
                  <strong className="text-foreground">Instituições</strong> do cliente — marque-a como
                  &ldquo;da casa&rdquo; para que os ativos contem como Patrimônio na EQI.
                </p>
              ) : (
                <>
                  <Select value={instId} onValueChange={setInstId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a instituição" />
                    </SelectTrigger>
                    <SelectContent>
                      {(instituicoes ?? []).map((inst) => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.nome}
                          {inst.interna ? " · conta como EQI" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isEdit && (
                    <p className="text-xs text-muted-foreground">
                      Trocar a instituição move o ativo — use para corrigir um lançamento feito na
                      custódia errada.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v: SoWTipoAtivo) => setTipo(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do ativo"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Valor aplicado (R$)</Label>
            <Input
              value={valorAplicado}
              onChange={(e) => setValorAplicado(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Rentabilidade</Label>
            <Input
              value={rentabilidade}
              onChange={(e) => setRentabilidade(e.target.value)}
              placeholder="ex.: 110% CDI"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Data de aplicação</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataAplicacao && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataAplicacao
                    ? format(dataAplicacao, "PPP", { locale: ptBR })
                    : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataAplicacao}
                  onSelect={setDataAplicacao}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label>Vencimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !vencimento && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {vencimento ? format(vencimento, "PPP", { locale: ptBR }) : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={vencimento}
                  onSelect={setVencimento}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label>Liquidez</Label>
            <Input
              value={liquidez}
              onChange={(e) => setLiquidez(e.target.value)}
              placeholder="ex.: D+0, no vencimento"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Custódia</Label>
            <Input
              value={custodia}
              onChange={(e) => setCustodia(e.target.value)}
              placeholder="Custódia"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v: SoWAtivoStatus) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-1.5">
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
            {isPending ? "Salvando..." : isEdit ? "Salvar" : "Criar ativo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
