/**
 * Composição da carteira de um cliente — a conta única do frontend.
 *
 * ESPELHA `cdr-prospeccao-backend/lib/sow/recalc.js`. Se aquele arquivo mudar,
 * este muda junto. A regra do "declarado sem detalhe" já tinha QUATRO cópias no
 * repo (recalc.js, routes/sow/dashboard.js, lib/sow/aiContext.js e o
 * CarteirasView) — este módulo substitui a do frontend, não acrescenta uma
 * quinta.
 *
 * A entrada é o retorno de `GET /sow/clientes/:id/instituicoes`, que já vem com
 * os ativos aninhados (`routes/sow/instituicoes.js` faz `include: { ativos }`).
 * Uma query só, sem join manual, sem request extra.
 */
import type { SoWAtivo, SoWInstituicao, SoWTipoAtivo } from "@/types/sow";

/**
 * Rótulo único do saldo que o extrato declara e ninguém abriu em ativos.
 *
 * "Declarado sem detalhe", e não "Não mapeado" (jargão de dev) nem "Saldo em
 * caixa" (invenção — ninguém sabe em que está aplicado). Sempre acompanhado do
 * tooltip de `NaoMapeadoHint`.
 */
export const LABEL_NAO_MAPEADO = "Declarado sem detalhe";

/** Percentual com guarda de denominador zero (cliente sem instituição, ou tudo zerado). */
export const pctDe = (v: number, total: number) => (total > 0 ? (v / total) * 100 : 0);

/**
 * Classes amplas de ativo, derivadas 1-para-1 do enum `TipoAtivo`.
 *
 * NÃO tenta reproduzir as classes que a IA escreve em prosa ("Debêntures
 * incentivadas", "CRA/CRI", "Caixa", "Multimercado"): nenhuma delas é derivável
 * do banco. A isenção de debênture não está em campo nenhum; CRA/CRI não existe
 * no enum e cai em "Outros"; "Caixa" dependeria de `liquidez`, que é texto
 * livre; e há UM `Fundo`, então não dá para separar multimercado de renda fixa.
 * A IA chega nelas lendo `nome`/`rentabilidade`/`liquidez` — é trabalho de
 * modelo, não de switch, e forjar aqui poria número errado na tela do assessor.
 */
export const CLASSES = [
  "Renda fixa",
  "Fundos",
  "Renda variável",
  "Previdência",
  "Estruturados",
  "Outros",
] as const;
export type ClasseAtivo = (typeof CLASSES)[number];

const CLASSE_POR_TIPO: Record<SoWTipoAtivo, ClasseAtivo> = {
  CDB: "Renda fixa",
  LCA: "Renda fixa",
  LCI: "Renda fixa",
  Debênture: "Renda fixa",
  Tesouro: "Renda fixa",
  Poupança: "Renda fixa",
  "Renda Fixa Internacional": "Renda fixa",
  Fundo: "Fundos",
  Ação: "Renda variável",
  "Fundo Imobiliário": "Renda variável",
  Cripto: "Renda variável",
  Previdência: "Previdência",
  COE: "Estruturados",
  Outros: "Outros",
};

export const classeDoTipo = (tipo: SoWTipoAtivo): ClasseAtivo =>
  CLASSE_POR_TIPO[tipo] ?? "Outros";

export interface CarteiraInstituicao {
  id: string;
  nome: string;
  interna: boolean;
  valorInformado: number | null;
  /**
   * A linha crua da API. Os formulários de edição precisam dela inteira, e ter
   * o objeto original aqui evita cast e evita ir buscar numa segunda query.
   */
  origem: SoWInstituicao;
  /** Soma dos ativos cadastrados. */
  mapeado: number;
  /** `max(0, valorInformado - mapeado)` — o que o extrato declara e ninguém abriu. */
  naoMapeado: number;
  /** `mapeado + naoMapeado`. É ESTE o número que entra no total do cliente. */
  patrimonio: number;
  pct: number;
  ativos: SoWAtivo[];
  /**
   * `valorInformado < mapeado`: o declarado é silenciosamente descartado pelo
   * `max(0, ...)` do recalc e ninguém avisava o assessor.
   */
  declaradoDefasado: boolean;
}

export interface CarteiraAtivo extends SoWAtivo {
  instituicaoNome: string;
  instituicaoInterna: boolean;
  classe: ClasseAtivo;
  /**
   * SEMPRE sobre o total do CLIENTE — nunca sobre o total da instituição. Senão
   * o mesmo papel diria 12% na aba Ativos e 40% dentro do card do banco.
   */
  pct: number;
}

export interface FatiaCarteira {
  name: string;
  value: number;
  pct: number;
}

export interface Carteira {
  total: number;
  interno: number;
  externo: number;
  sharePct: number;
  mapeadoTotal: number;
  naoMapeadoTotal: number;
  /** Desc por patrimônio. */
  instituicoes: CarteiraInstituicao[];
  /** Desc por valor aplicado. */
  ativos: CarteiraAtivo[];
  porClasse: FatiaCarteira[];
  porTipo: FatiaCarteira[];
  porInstituicao: (FatiaCarteira & { interna: boolean })[];
  internoVsExterno: FatiaCarteira[];
}

export function composicaoDaCarteira(insts: SoWInstituicao[] | undefined): Carteira {
  const parciais = (insts ?? []).map((i) => {
    const ativos = i.ativos ?? [];
    const mapeado = ativos.reduce((acc, a) => acc + (a.valorAplicado ?? 0), 0);
    const declarado = i.valorInformado ?? 0;
    const naoMapeado = Math.max(0, declarado - mapeado);
    return {
      id: i.id,
      nome: i.nome,
      interna: i.interna,
      valorInformado: i.valorInformado,
      origem: i,
      mapeado,
      naoMapeado,
      patrimonio: mapeado + naoMapeado,
      ativos,
      declaradoDefasado: i.valorInformado != null && declarado < mapeado,
    };
  });

  const total = parciais.reduce((acc, c) => acc + c.patrimonio, 0);
  const interno = parciais.filter((c) => c.interna).reduce((acc, c) => acc + c.patrimonio, 0);
  const externo = Math.max(0, total - interno);
  const mapeadoTotal = parciais.reduce((acc, c) => acc + c.mapeado, 0);
  const naoMapeadoTotal = parciais.reduce((acc, c) => acc + c.naoMapeado, 0);

  const instituicoes: CarteiraInstituicao[] = parciais
    .map((c) => ({ ...c, pct: pctDe(c.patrimonio, total) }))
    .sort((a, b) => b.patrimonio - a.patrimonio);

  const ativos: CarteiraAtivo[] = instituicoes
    .flatMap((c) =>
      c.ativos.map((a) => ({
        ...a,
        instituicaoNome: c.nome,
        instituicaoInterna: c.interna,
        classe: classeDoTipo(a.tipo),
        pct: pctDe(a.valorAplicado ?? 0, total),
      }))
    )
    .sort((a, b) => (b.valorAplicado ?? 0) - (a.valorAplicado ?? 0));

  // Agrega por chave e devolve desc, com o balde do declarado no fim. Sem esse
  // balde o donut soma MENOS que o patrimônio do cliente — mesma razão de
  // routes/sow/dashboard.js.
  const agrupar = (chave: (a: CarteiraAtivo) => string): FatiaCarteira[] => {
    const acc = new Map<string, number>();
    for (const a of ativos) acc.set(chave(a), (acc.get(chave(a)) ?? 0) + (a.valorAplicado ?? 0));
    const lista = [...acc.entries()]
      .map(([name, value]) => ({ name, value, pct: pctDe(value, total) }))
      .filter((e) => e.value > 0)
      .sort((a, b) => b.value - a.value);
    if (naoMapeadoTotal > 0) {
      lista.push({
        name: LABEL_NAO_MAPEADO,
        value: naoMapeadoTotal,
        pct: pctDe(naoMapeadoTotal, total),
      });
    }
    return lista;
  };

  return {
    total,
    interno,
    externo,
    sharePct: pctDe(interno, total),
    mapeadoTotal,
    naoMapeadoTotal,
    instituicoes,
    ativos,
    porClasse: agrupar((a) => a.classe),
    porTipo: agrupar((a) => a.tipo),
    porInstituicao: instituicoes
      .filter((c) => c.patrimonio > 0)
      .map((c) => ({ name: c.nome, value: c.patrimonio, pct: c.pct, interna: c.interna })),
    internoVsExterno: [
      { name: "Na EQI", value: interno, pct: pctDe(interno, total) },
      { name: "Externo", value: externo, pct: pctDe(externo, total) },
    ].filter((e) => e.value > 0),
  };
}
