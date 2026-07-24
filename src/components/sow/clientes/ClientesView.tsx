import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSoW } from "@/context/SoWContext";
import { useSoWClientes } from "@/hooks/sow/useSoW";
import type { SoWClienteStatus } from "@/types/sow";
import { ClienteCard } from "./ClienteCard";
import { ClienteDetail } from "./ClienteDetail";
import { NewClienteDialog } from "./NewClienteDialog";
import { ImportarClientesDialog } from "./ImportarClientesDialog";
import { Plus, Download, Users } from "lucide-react";

const STATUS_OPTIONS: SoWClienteStatus[] = [
  "Prospect",
  "Ativo",
  "Em Negociação",
  "Convertido",
  "Inativo",
  "Perdido",
];

export default function ClientesView({
  onNavigate,
}: {
  onNavigate?: (key: string) => void;
}) {
  const { selectedClienteId, setSelectedClienteId, scope } = useSoW();
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [sort, setSort] = useState<string>("share");

  const { data, isLoading } = useSoWClientes({
    scope: scope || undefined,
    status: statusFilter === "todos" ? undefined : statusFilter,
    sort,
  });

  void onNavigate;

  if (selectedClienteId) {
    return <ClienteDetail clienteId={selectedClienteId} />;
  }

  const clientes = data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Clientes</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="share">Ordenar por share</SelectItem>
              <SelectItem value="score">Ordenar por score</SelectItem>
              <SelectItem value="nome">Ordenar por nome</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Download className="mr-2 h-4 w-4" />
            Importar da prospecção
          </Button>
          <Button onClick={() => setShowNew(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo cliente
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[220px] rounded-lg" />
          ))}
        </div>
      ) : clientes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum cliente ainda — cadastre ou importe da prospecção.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientes.map((c) => (
            <ClienteCard key={c.id} cliente={c} onClick={() => setSelectedClienteId(c.id)} />
          ))}
        </div>
      )}

      <NewClienteDialog open={showNew} onOpenChange={setShowNew} />
      <ImportarClientesDialog open={showImport} onOpenChange={setShowImport} />
    </div>
  );
}
