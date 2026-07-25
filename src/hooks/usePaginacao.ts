import { useEffect, useMemo, useState } from "react";

/**
 * Paginação em memória, sobre uma lista já carregada.
 *
 * É deliberadamente client-side: busca, filtros e ordenação das telas de
 * Contatos e Perdidos acontecem no navegador sobre o array completo, e os KPIs
 * do Dashboard, Kanban, Métricas e Pendências também. Paginar no servidor
 * exigiria endpoints de agregação que o CRM não tem. O gargalo que isto resolve
 * é o de RENDER — ~1500 linhas, cada uma com dois Select do Radix, um Popover
 * com Calendar e sete Button.
 *
 * `chaveReset` volta para a primeira página quando muda: trocar de filtro
 * mantendo a página 7 deixaria a tela vazia sem explicação. Um clamp sozinho
 * não resolve, porque a lista pode continuar tendo 7 páginas com conteúdo
 * completamente diferente.
 */
export function usePaginacao<T>(
  itens: T[],
  opcoes: { tamanhoInicial?: number; chaveReset?: string } = {}
) {
  const { tamanhoInicial = 50, chaveReset } = opcoes;

  const [pagina, setPagina] = useState(1);
  const [tamanho, setTamanho] = useState(tamanhoInicial);

  useEffect(() => {
    setPagina(1);
  }, [chaveReset, tamanho]);

  const total = itens.length;
  const totalPaginas = Math.max(1, Math.ceil(total / tamanho));

  // Clamp em vez de reset: a lista também encolhe por refetch e por exclusão,
  // e nesses casos jogar o usuário para a página 1 seria pior que ajustar.
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * tamanho;

  const visiveis = useMemo(
    () => itens.slice(inicio, inicio + tamanho),
    [itens, inicio, tamanho]
  );

  return {
    visiveis,
    pagina: paginaAtual,
    totalPaginas,
    total,
    tamanho,
    setTamanho,
    // 1-indexado e inclusivo, para exibir "1–50 de 1515". Zero itens => 0–0.
    primeiroItem: total === 0 ? 0 : inicio + 1,
    ultimoItem: Math.min(inicio + tamanho, total),
    irPara: (p: number) => setPagina(Math.min(Math.max(1, p), totalPaginas)),
    anterior: () => setPagina((p) => Math.max(1, Math.min(p, totalPaginas) - 1)),
    proxima: () => setPagina((p) => Math.min(totalPaginas, Math.min(p, totalPaginas) + 1)),
  };
}
