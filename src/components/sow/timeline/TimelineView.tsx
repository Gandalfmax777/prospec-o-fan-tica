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
import { CalendarClock } from "lucide-react";
import { ClienteTimeline } from "./ClienteTimeline";

export default function TimelineView() {
  const { selectedClienteId, setSelectedClienteId, scope } = useSoW();
  const { data, isLoading } = useSoWClientes({ scope: scope || undefined });

  if (selectedClienteId) {
    return <ClienteTimeline clienteId={selectedClienteId} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2">
          <CalendarClock className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Timeline</h2>
      </div>

      {isLoading ? (
        <Skeleton className="h-10 w-[280px] rounded-md" />
      ) : (
        <div className="max-w-sm">
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
        Selecione um cliente para ver sua timeline.
      </p>
    </div>
  );
}
