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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateCliente } from "@/hooks/sow/useSoW";
import type { SoWClienteStatus } from "@/types/sow";
import { toast } from "sonner";

const STATUS_OPTIONS: SoWClienteStatus[] = [
  "Prospect",
  "Ativo",
  "Em Negociação",
  "Convertido",
  "Inativo",
  "Perdido",
];

export function NewClienteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate, isPending } = useCreateCliente();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [codigo, setCodigo] = useState("");
  const [status, setStatus] = useState<SoWClienteStatus>("Prospect");
  const [metaSharePct, setMetaSharePct] = useState<number>(80);

  useEffect(() => {
    if (!open) {
      setNome("");
      setEmail("");
      setTelefone("");
      setCidade("");
      setCodigo("");
      setStatus("Prospect");
      setMetaSharePct(80);
    }
  }, [open]);

  const handleSubmit = () => {
    if (!nome.trim()) {
      toast.error("O nome é obrigatório.");
      return;
    }
    mutate(
      {
        nome: nome.trim(),
        email: email.trim() || null,
        telefone: telefone.trim() || null,
        cidade: cidade.trim() || null,
        codigo: codigo.trim() || null,
        status,
        metaSharePct,
      },
      {
        onSuccess: () => {
          toast.success("Cliente criado com sucesso!");
          onOpenChange(false);
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Erro ao criar cliente."),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 space-y-1.5">
            <Label>
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Cidade</Label>
            <Input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" />
          </div>
          <div className="space-y-1.5">
            <Label>Código</Label>
            <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Código" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v: SoWClienteStatus) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Meta de share (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={metaSharePct}
              onChange={(e) => setMetaSharePct(Number(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Salvando..." : "Criar cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
