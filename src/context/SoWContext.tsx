import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

// Estado APENAS de UI do módulo SoW (cliente selecionado, filtros).
// O estado de servidor vive no react-query (hooks/sow/useSoW.ts).
// Montado keyed por organizationId em ShareOfWallet.tsx.

interface SoWContextValue {
  selectedClienteId: string | null;
  setSelectedClienteId: (id: string | null) => void;
  scope: string; // "me" | "team" | "org"
  setScope: (s: string) => void;
}

const SoWContext = createContext<SoWContextValue | null>(null);

export function SoWProvider({ children }: { children: ReactNode }) {
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [scope, setScope] = useState<string>("");

  const value = useMemo(
    () => ({ selectedClienteId, setSelectedClienteId, scope, setScope }),
    [selectedClienteId, scope]
  );

  return <SoWContext.Provider value={value}>{children}</SoWContext.Provider>;
}

export function useSoW(): SoWContextValue {
  const ctx = useContext(SoWContext);
  if (!ctx) throw new Error("useSoW deve ser usado dentro de <SoWProvider>");
  return ctx;
}
