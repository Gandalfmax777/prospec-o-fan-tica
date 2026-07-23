import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useImportFromLead } from "@/hooks/sow/useSoW";
import { api } from "@/services/api";
import type { LeadResponse } from "@/types/api";
import { toast } from "sonner";
import { Search } from "lucide-react";

export function ImportarClientesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutateAsync, isPending } = useImportFromLead();
  const [leads, setLeads] = useState<LeadResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelected(new Set());
      return;
    }
    let alive = true;
    setLoading(true);
    api
      .getLeads()
      .then((data) => {
        if (alive) setLeads(data);
      })
      .catch((err) => {
        if (alive)
          toast.error(err instanceof Error ? err.message : "Erro ao carregar leads.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter(
      (l) =>
        l.nome.toLowerCase().includes(term) ||
        (l.telefone ?? "").toLowerCase().includes(term)
    );
  }, [leads, search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    const ids = [...selected];
    if (ids.length === 0) {
      toast.error("Selecione ao menos um lead.");
      return;
    }
    let ok = 0;
    for (const id of ids) {
      try {
        await mutateAsync(id);
        ok += 1;
      } catch {
        /* segue para os próximos */
      }
    }
    if (ok > 0) toast.success(`${ok} cliente(s) importado(s) da prospecção.`);
    if (ok < ids.length) toast.error(`${ids.length - ok} não puderam ser importados.`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar da prospecção</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Copia nome/telefone/email/assessor do lead; a prospecção não é alterada.
        </p>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone"
            className="pl-8"
          />
        </div>

        <ScrollArea className="h-[320px] rounded-md border border-border/50">
          {loading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhum lead encontrado.
            </p>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map((lead) => (
                <label
                  key={lead.id}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors"
                >
                  <Checkbox
                    checked={selected.has(lead.id)}
                    onCheckedChange={() => toggle(lead.id)}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{lead.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.telefone || "sem telefone"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">
            {selected.size} selecionado(s)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={isPending || selected.size === 0}>
              {isPending ? "Importando..." : "Importar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
