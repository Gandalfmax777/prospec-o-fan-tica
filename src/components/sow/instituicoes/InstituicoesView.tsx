import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSoW } from "@/context/SoWContext";
import { useSoWClientes } from "@/hooks/sow/useSoW";
import { Building2 } from "lucide-react";
import { InstituicoesPanel } from "./InstituicoesPanel";

export default function InstituicoesView() {
  const { selectedClienteId, setSelectedClienteId, scope } = useSoW();
  const { data, isLoading } = useSoWClientes({ scope: scope || undefined });

  if (selectedClienteId) {
    return <InstituicoesPanel clienteId={selectedClienteId} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Instituições</h2>
      </div>

      {isLoading ? (
        <Skeleton className="h-10 w-[280px] rounded-md" />
      ) : (
        <div className="max-w-sm space-y-2">
          <Select onValueChange={(v) => setSelectedClienteId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {(data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Selecione um cliente para ver suas instituições.
      </p>
    </div>
  );
}
