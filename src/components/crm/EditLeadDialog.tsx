import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Cadencia, Lead, Origem, Temperatura } from "@/types/crm";
import { ORIGENS, ORIGEM_LABELS } from "@/lib/origemConstants";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";

interface EditLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

export const EditLeadDialog = ({ open, onOpenChange, lead }: EditLeadDialogProps) => {
  const { updateLead } = useCRM();
  const [editedLead, setEditedLead] = useState({
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
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Carregar dados do lead quando o dialog abrir
  useEffect(() => {
    if (open && lead) {
      setEditedLead({
        nome: lead.nome || "",
        cidade: lead.cidade || "",
        origem: lead.origem || "WEBSITE",
        telefone: lead.telefone || "",
        cadencia: lead.cadencia || "Semanal",
        ultimoContato: lead.ultimoContato ? new Date(lead.ultimoContato) : null,
        temperatura: lead.temperatura || "Frio",
        observacao: lead.observacao || "",
        estimatedValueCents: lead.estimatedValueCents ?? null,
        statedValueCents: lead.statedValueCents ?? null,
        currency: lead.currency || "BRL",
      });
      setValidationErrors({});
    }
  }, [open, lead]);

  const validateLead = (): {
    isValid: boolean;
    errors: Record<string, string>;
  } => {
    const errors: Record<string, string> = {};

    // Validar campos obrigatórios
    if (!editedLead.nome || editedLead.nome.trim().length === 0) {
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
    if (!origensValidas.includes(editedLead.origem)) {
      errors.origem = "Origem inválida";
    }

    const cadenciasValidas: Cadencia[] = ["Diaria", "Semanal", "Quinzenal", "Mensal"];
    if (!cadenciasValidas.includes(editedLead.cadencia)) {
      errors.cadencia = "Cadência inválida";
    }

    setValidationErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleSave = async () => {
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
      // Preparar dados para envio
      const leadToUpdate = {
        ...editedLead,
        observacao: editedLead.observacao.trim() || undefined,
        ultimoContato: editedLead.ultimoContato,
      };

      await updateLead(lead.id, leadToUpdate);
      onOpenChange(false);
      toast({
        title: "Sucesso",
        description: "Contato atualizado com sucesso!",
      });
    } catch (err) {
      console.error("Erro ao atualizar lead:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao atualizar lead";
      toast({
        title: "Erro ao atualizar lead",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleFieldChange = (
    field: string,
    value: string | Date | null | Cadencia | Origem | Temperatura
  ) => {
    setEditedLead({ ...editedLead, [field]: value });
    // Limpar erro do campo quando o usuário começar a digitar
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar contato</DialogTitle>
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
              value={editedLead.nome}
              onChange={(e) => handleFieldChange("nome", e.target.value)}
              placeholder="Nome do contato"
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
              value={editedLead.cidade}
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
              value={editedLead.origem}
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
              value={editedLead.telefone}
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
              value={editedLead.estimatedValueCents}
              onChange={(estimatedValueCents) =>
                setEditedLead({
                  ...editedLead,
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
              value={editedLead.statedValueCents}
              onChange={(statedValueCents) =>
                setEditedLead({
                  ...editedLead,
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
              value={editedLead.cadencia}
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
                <SelectItem value="Diaria">Diária</SelectItem>
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
              value={editedLead.temperatura}
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
                    !editedLead.ultimoContato && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {editedLead.ultimoContato
                    ? format(editedLead.ultimoContato, "PPP", { locale: ptBR })
                    : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={editedLead.ultimoContato || undefined}
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
            <Textarea
              value={editedLead.observacao}
              onChange={(e) => handleFieldChange("observacao", e.target.value)}
              placeholder="Observações sobre o contato"
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar alterações</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
