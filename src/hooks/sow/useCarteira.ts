import { useMemo } from "react";

import { useSoWInstituicoes } from "./useSoW";
import { composicaoDaCarteira, type Carteira } from "@/lib/sow/carteira";

/**
 * Composição da carteira do cliente: valor e % por ativo, por classe, por
 * instituição, e o split EQI × externo.
 *
 * UMA query só. `GET /sow/clientes/:id/instituicoes` já devolve os ativos
 * aninhados em cada instituição (`routes/sow/instituicoes.js` faz
 * `include: { ativos }`), então não é preciso somar `useSoWAtivosCliente` nem
 * refazer o join por `instituicaoId` — que era o que o CarteirasView fazia.
 *
 * Invalidação já está coberta: `keys.instituicoes` cai junto no
 * `useInvalidateSoW` que toda mutação de ativo/instituição dispara.
 */
export function useCarteira(clienteId: string | null) {
  const { data, isLoading, error } = useSoWInstituicoes(clienteId);
  const carteira = useMemo<Carteira>(() => composicaoDaCarteira(data), [data]);
  return { carteira, isLoading, error };
}
