import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import { useCRM } from "@/context/CRMContext";
import { toast } from "@/hooks/use-toast";
import { formatPhone } from "@/lib/phoneMask";
import { cn } from "@/lib/utils";
import { Cadencia, Origem, Temperatura } from "@/types/crm";
import { ORIGENS, ORIGEM_LABELS } from "@/lib/origemConstants";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus } from "lucide-react";
import { useState, useEffect } from "react";

export const NewLeadDialog = () => {
  const { addLead } = useCRM();
  const [open, setOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    nome: "",
    cidade: "",
    origem: "WEBSITE" as Origem,
    telefone: "",
    cadencia: "Semanal" as Cadencia,
    ultimoContato: null as Date | null,
    temperatura: "Frio" as Temperatura,
    observacao: "",
    estimatedValueCents: null as number | null,
    statedValueCents: null as number | null,
    currency: "BRL",
    dataEntrada: new Date(),
    dataConversao: null as Date | null,
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Resetar formulário quando o modal é fechado
  useEffect(() => {
    if (!open) {
      setNewLead({
        nome: "",
        cidade: "",
        origem: "WEBSITE" as Origem,
        telefone: "",
        cadencia: "Semanal" as Cadencia,
        ultimoContato: null,
        temperatura: "Frio" as Temperatura,
        observacao: "",
        estimatedValueCents: null,
        statedValueCents: null,
        currency: "BRL",
        dataEntrada: new Date(),
        dataConversao: null,
      });
      setValidationErrors({});
    }
  }, [open]);

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

  const formatCentsForInput = (value: number | null) => {
    if (value == null) return "";
    return (value / 100).toFixed(2).replace(".", ",");
  };

  const validateLead = (): {
    isValid: boolean;
    errors: Record<string, string>;
  } => {
    const errors: Record<string, string> = {};

    // Validar campos obrigatórios
    if (!newLead.nome || newLead.nome.trim().length === 0) {
      errors.nome = "Nome é obrigatório";
    }

    // Validar enums
    const origensValidas: Origem[] = [
      "WEBSITE",
      "REFERRAL",
      "SOCIAL_MEDIA",
      "EMAIL",
      "PHONE",
      "EVENT",
      "OTHER",
    ];
    if (!origensValidas.includes(newLead.origem)) {
      errors.origem = "Origem inválida";
    }

    const cadenciasValidas: Cadencia[] = ["Semanal", "Quinzenal", "Mensal"];
    if (!cadenciasValidas.includes(newLead.cadencia)) {
      errors.cadencia = "Cadência inválida";
    }

    setValidationErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleAddLead = async () => {
    // Limpar erros anteriores
    setValidationErrors({});

    // Validar antes de enviar
    const validation = validateLead();
    if (!validation.isValid) {
      const errorFields = Object.keys(validation.errors);
      const fieldNames: Record<string, string> = {
        nome: "Nome",
        origem: "Origem",
        cadencia: "Cadência",
      };
      const fieldNamesTranslated = errorFields.map(
        (field) => fieldNames[field] || field
      );
      toast({
        title: "Erro de validação",
        description: `Por favor, corrija os seguintes campos: ${fieldNamesTranslated.join(
          ", "
        )}`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Preparar dados para envio, convertendo strings vazias para null em campos opcionais
      const leadToSend = {
        ...newLead,
        observacao: newLead.observacao.trim() || undefined,
      };

      await addLead(leadToSend);
      setOpen(false);
      setValidationErrors({});
      setNewLead({
        nome: "",
        cidade: "",
        origem: "WEBSITE",
        telefone: "",
        cadencia: "Semanal",
        ultimoContato: null,
        temperatura: "Frio",
        observacao: "",
        estimatedValueCents: null,
        statedValueCents: null,
        currency: "BRL",
        dataEntrada: new Date(),
        dataConversao: null,
      });
      toast({
        title: "Sucesso",
        description: "Lead cadastrado com sucesso!",
      });
    } catch (err) {
      console.error("Erro ao adicionar lead:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao adicionar lead";
      toast({
        title: "Erro ao adicionar lead",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleFieldChange = (
    field: string,
    value: string | Date | null | Cadencia | Origem | Temperatura
  ) => {
    setNewLead({ ...newLead, [field]: value });
    // Limpar erro do campo quando o usuário começar a digitar
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar novo lead</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Campos marcados com <span className="text-destructive">*</span> são
            obrigatórios
          </p>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Nome <span className="text-destructive">*</span>
            </label>
            <Input
              value={newLead.nome}
              onChange={(e) => handleFieldChange("nome", e.target.value)}
              placeholder="Nome do lead"
              className={cn(validationErrors.nome && "border-destructive")}
            />
            {validationErrors.nome && (
              <p className="text-xs text-destructive">
                {validationErrors.nome}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cidade</label>
            <Input
              value={newLead.cidade}
              onChange={(e) => handleFieldChange("cidade", e.target.value)}
              placeholder="Cidade"
              className={cn(validationErrors.cidade && "border-destructive")}
            />
            {validationErrors.cidade && (
              <p className="text-xs text-destructive">
                {validationErrors.cidade}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Origem</label>
            <Select
              value={newLead.origem}
              onValueChange={(v: Origem) => handleFieldChange("origem", v)}
            >
              <SelectTrigger
                className={cn(validationErrors.origem && "border-destructive")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORIGENS.map((origem) => (
                  <SelectItem key={origem} value={origem}>
                    {ORIGEM_LABELS[origem]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.origem && (
              <p className="text-xs text-destructive">
                {validationErrors.origem}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Telefone</label>
            <Input
              value={newLead.telefone}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value);
                handleFieldChange("telefone", formatted);
              }}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className={cn(validationErrors.telefone && "border-destructive")}
            />
            {validationErrors.telefone && (
              <p className="text-xs text-destructive">
                {validationErrors.telefone}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor estimado (BRL)</label>
            <CurrencyInput
              value={newLead.estimatedValueCents}
              onChange={(estimatedValueCents) =>
                setNewLead({
                  ...newLead,
                  estimatedValueCents,
                  currency: "BRL",
                })
              }
              placeholder="0,00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor informado (BRL)</label>
            <CurrencyInput
              value={newLead.statedValueCents}
              onChange={(statedValueCents) =>
                setNewLead({
                  ...newLead,
                  statedValueCents,
                  currency: "BRL",
                })
              }
              placeholder="0,00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cadência</label>
            <Select
              value={newLead.cadencia}
              onValueChange={(v: Cadencia) => handleFieldChange("cadencia", v)}
            >
              <SelectTrigger
                className={cn(
                  validationErrors.cadencia && "border-destructive"
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semanal">Semanal</SelectItem>
                <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                <SelectItem value="Mensal">Mensal</SelectItem>
              </SelectContent>
            </Select>
            {validationErrors.cadencia && (
              <p className="text-xs text-destructive">
                {validationErrors.cadencia}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Temperatura</label>
            <Select
              value={newLead.temperatura}
              onValueChange={(v: Temperatura) =>
                handleFieldChange("temperatura", v)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Frio">Frio</SelectItem>
                <SelectItem value="Morno">Morno</SelectItem>
                <SelectItem value="Quente">Quente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Último contato</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newLead.ultimoContato && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newLead.ultimoContato
                    ? format(newLead.ultimoContato, "PPP", { locale: ptBR })
                    : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newLead.ultimoContato || undefined}
                  onSelect={(date) =>
                    handleFieldChange("ultimoContato", date || null)
                  }
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="col-span-2 space-y-2">
            <label className="text-sm font-medium">Observação</label>
            <Input
              value={newLead.observacao}
              onChange={(e) => handleFieldChange("observacao", e.target.value)}
              placeholder="Observações sobre o lead"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAddLead}>Adicionar lead</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
