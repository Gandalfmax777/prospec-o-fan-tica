import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSoW, useSoWScopeParams } from "@/context/SoWContext";
import { useSoWClientes } from "@/hooks/sow/useSoW";
import { CarteiraPanel } from "@/components/sow/shared/CarteiraPanel";
import { ArrowLeft, Wallet } from "lucide-react";

/**
 * Carteira por cliente, pelo menu lateral.
 *
 * Os gráficos e a agregação viviam aqui, numa cópia local da regra do
 * `lib/sow/recalc.js` do backend. Migraram para `lib/sow/carteira.ts` +
 * `CarteiraPanel`, que a aba "Carteira" do detalhe do cliente também usa — a
 * mesma tela em dois caminhos de navegação, não duas implementações.
 */
export default function CarteirasView() {
  const { selectedClienteId, setSelectedClienteId } = useSoW();
  const { data, isLoading } = useSoWClientes(useSoWScopeParams());

  const clienteNome = useMemo(
    () => (data ?? []).find((c) => c.id === selectedClienteId)?.nome ?? "",
    [data, selectedClienteId]
  );

  if (selectedClienteId) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedClienteId(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Trocar cliente
          </Button>
          <h2 className="text-xl font-bold text-foreground">
            Carteira{clienteNome ? ` · ${clienteNome}` : ""}
          </h2>
        </div>
        <CarteiraPanel clienteId={selectedClienteId} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Carteiras</h2>
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
        Selecione um cliente para ver a composição da carteira.
      </p>
    </div>
  );
}
