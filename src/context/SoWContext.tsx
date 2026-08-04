import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Estado APENAS de UI do módulo SoW (cliente selecionado, filtros).
// O estado de servidor vive no react-query (hooks/sow/useSoW.ts).
// Montado keyed por organizationId em ShareOfWallet.tsx.

export type SoWScope = "me" | "team" | "org";

interface SoWContextValue {
  selectedClienteId: string | null;
  setSelectedClienteId: (id: string | null) => void;
  scope: SoWScope;
  setScope: (s: SoWScope) => void;
  /** Drill-down num assessor (visão de Liderança). Vence o `scope` no backend. */
  assessorId: string | null;
  /** Só para rotular a tela — o nome não vai para o backend. */
  assessorNome: string | null;
  setAssessorId: (id: string | null, nome?: string | null) => void;
}

const SoWContext = createContext<SoWContextValue | null>(null);

export function SoWProvider({ children }: { children: ReactNode }) {
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  /**
   * "me" e não "" (o valor até 04/08/2026).
   *
   * String vazia significava "não manda o parâmetro", e sem `?scope=` o backend
   * cai no default por papel (lib/sow/scope.js): organização inteira para ADMIN,
   * time para LEADER. Como o `setScope` nunca era chamado por ninguém, o líder
   * abria o SoW com a carteira do time fundida com a dele, sem etiqueta de dono
   * e sem controle nenhum para separar — o B.O. que o cliente reportou.
   *
   * Agora o módulo abre sempre na carteira de quem está logado, e a visão
   * agregada é uma escolha explícita (seletor no header, aba Liderança).
   */
  const [scope, setScope] = useState<SoWScope>("me");
  const [assessorId, setAssessorIdState] = useState<string | null>(null);
  const [assessorNome, setAssessorNome] = useState<string | null>(null);

  // Selecionar um assessor implica sair de "meus clientes": deixar `scope: "me"`
  // junto com um assessorId de outra pessoa é uma combinação que a UI não
  // conseguiria rotular honestamente. O backend prioriza o assessorId de
  // qualquer forma; aqui é o rótulo da tela que precisa ficar coerente.
  const setAssessorId = useCallback((id: string | null, nome: string | null = null) => {
    setAssessorIdState(id);
    setAssessorNome(id ? nome : null);
    if (id) setScope("team");
  }, []);

  const value = useMemo(
    () => ({
      selectedClienteId,
      setSelectedClienteId,
      scope,
      setScope,
      assessorId,
      assessorNome,
      setAssessorId,
    }),
    [selectedClienteId, scope, assessorId, assessorNome, setAssessorId]
  );

  return <SoWContext.Provider value={value}>{children}</SoWContext.Provider>;
}

export function useSoW(): SoWContextValue {
  const ctx = useContext(SoWContext);
  if (!ctx) throw new Error("useSoW deve ser usado dentro de <SoWProvider>");
  return ctx;
}

/**
 * O recorte corrente, pronto para ir aos hooks de dados.
 *
 * Existe para que nenhuma tela precise lembrar de montar isso à mão — foi
 * exatamente o esquecimento coletivo que fez o módulo inteiro consultar o
 * backend sem escopo nenhum. Toda view que lista ou agrega espalha isto no
 * parâmetro do hook.
 */
export function useSoWScopeParams(): { scope: SoWScope; assessorId?: string } {
  const { scope, assessorId } = useSoW();
  return useMemo(
    () => ({ scope, ...(assessorId ? { assessorId } : {}) }),
    [scope, assessorId]
  );
}
