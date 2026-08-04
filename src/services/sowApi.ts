import { request, API_URL } from "./api";
import type {
  SoWCliente,
  SoWInstituicao,
  SoWInstituicaoCatalogo,
  SoWAtivo,
  SoWEventoTimeline,
  SoWOportunidade,
  SoWAlerta,
  SoWDashboard,
  SoWEquipe,
  SoWIndicadores,
  SoWShareSnapshot,
  SoWImportJob,
  SoWAnaliseCarteira,
  CreateClienteInput,
  UpdateClienteInput,
  CreateInstituicaoInput,
  CreateAtivoInput,
} from "@/types/sow";

/**
 * Recorte por assessor, aceito por toda rota de listagem/agregação do SoW.
 *
 * Mandar SEMPRE: sem `scope` o backend cai no default por papel (organização
 * inteira para ADMIN, time para LEADER) — foi assim que a carteira do líder
 * ficou fundida com a do time. Ver docs/API.md, "Escopo por assessor".
 */
// `type` e não `interface`: só aliases de objeto ganham index signature
// implícita, e sem ela nada disto entra no `Record<string, …>` que o `qs`
// abaixo recebe. Com interface, o tsc do CI (`tsc -b`) reprova.
export type SoWScopeParams = {
  scope?: string;
  assessorId?: string;
};

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const sowApi = {
  // ── Clientes ──
  getClientes: (params: SoWScopeParams & { status?: string; sort?: string } = {}) =>
    request<SoWCliente[]>(`/sow/clientes${qs(params)}`),
  getCliente: (id: string) => request<SoWCliente>(`/sow/clientes/${id}`),
  createCliente: (body: CreateClienteInput) =>
    request<SoWCliente>("/sow/clientes", { method: "POST", body }),
  updateCliente: (id: string, body: UpdateClienteInput) =>
    request<SoWCliente>(`/sow/clientes/${id}`, { method: "PUT", body }),
  deleteCliente: (id: string) =>
    request<null>(`/sow/clientes/${id}`, { method: "DELETE" }),
  // metaSharePct é obrigatória: a ponte era o caminho que criava cliente sem
  // meta explícita, caindo no default do banco (que já não existe mais).
  importFromLead: (leadId: string, metaSharePct: number) =>
    request<SoWCliente>("/sow/clientes/import-from-lead", {
      method: "POST",
      body: { leadId, metaSharePct },
    }),
  getClienteShare: (id: string) => request<{
    clienteId: string; patrimonioTotal: number; patrimonioInterno: number;
    patrimonioExterno: number; sharePct: number; metaSharePct: number; gap: number;
  }>(`/sow/clientes/${id}/share`),

  // ── Catálogo de instituições ──
  getCatalogo: () => request<SoWInstituicaoCatalogo[]>("/sow/instituicoes-catalogo"),
  createCatalogo: (body: { nome: string; interna?: boolean }) =>
    request<SoWInstituicaoCatalogo>("/sow/instituicoes-catalogo", { method: "POST", body }),
  updateCatalogo: (id: string, body: Partial<SoWInstituicaoCatalogo>) =>
    request<SoWInstituicaoCatalogo>(`/sow/instituicoes-catalogo/${id}`, { method: "PUT", body }),
  deleteCatalogo: (id: string) =>
    request<null>(`/sow/instituicoes-catalogo/${id}`, { method: "DELETE" }),

  // ── Instituições (por cliente) ──
  getInstituicoes: (clienteId: string) =>
    request<SoWInstituicao[]>(`/sow/clientes/${clienteId}/instituicoes`),
  createInstituicao: (clienteId: string, body: CreateInstituicaoInput) =>
    request<SoWInstituicao>(`/sow/clientes/${clienteId}/instituicoes`, { method: "POST", body }),
  updateInstituicao: (id: string, body: Partial<CreateInstituicaoInput>) =>
    request<SoWInstituicao>(`/sow/instituicoes/${id}`, { method: "PUT", body }),
  deleteInstituicao: (id: string) =>
    request<null>(`/sow/instituicoes/${id}`, { method: "DELETE" }),

  // ── Ativos ──
  getAtivosCliente: (clienteId: string) =>
    request<SoWAtivo[]>(`/sow/clientes/${clienteId}/ativos`),
  getAtivosInstituicao: (instituicaoId: string) =>
    request<SoWAtivo[]>(`/sow/instituicoes/${instituicaoId}/ativos`),
  createAtivo: (instituicaoId: string, body: CreateAtivoInput) =>
    request<SoWAtivo>(`/sow/instituicoes/${instituicaoId}/ativos`, { method: "POST", body }),
  updateAtivo: (id: string, body: Partial<CreateAtivoInput> & { instituicaoId?: string }) =>
    request<SoWAtivo>(`/sow/ativos/${id}`, { method: "PUT", body }),
  deleteAtivo: (id: string) =>
    request<null>(`/sow/ativos/${id}`, { method: "DELETE" }),

  // ── Timeline ──
  getTimeline: (clienteId: string, params: { from?: string; to?: string } = {}) =>
    request<SoWEventoTimeline[]>(`/sow/clientes/${clienteId}/timeline${qs(params)}`),
  createEvento: (clienteId: string, body: { data: string; tipo: string; descricao: string; valor?: number | null }) =>
    request<SoWEventoTimeline>(`/sow/clientes/${clienteId}/timeline`, { method: "POST", body }),
  deleteEvento: (id: string) =>
    request<null>(`/sow/timeline/${id}`, { method: "DELETE" }),

  // ── Oportunidades ──
  getOportunidades: (
    params: SoWScopeParams & { status?: string; urgencia?: string; clienteId?: string } = {}
  ) => request<SoWOportunidade[]>(`/sow/oportunidades${qs(params)}`),
  updateOportunidade: (id: string, body: Partial<SoWOportunidade>) =>
    request<SoWOportunidade>(`/sow/oportunidades/${id}`, { method: "PUT", body }),
  deleteOportunidade: (id: string) =>
    request<null>(`/sow/oportunidades/${id}`, { method: "DELETE" }),

  // ── Alertas ──
  getAlertas: (
    params: SoWScopeParams & { resolvido?: boolean; severidade?: string; clienteId?: string } = {}
  ) => request<SoWAlerta[]>(`/sow/alertas${qs(params)}`),
  updateAlerta: (id: string, body: { resolvido?: boolean }) =>
    request<SoWAlerta>(`/sow/alertas/${id}`, { method: "PUT", body }),
  deleteAlerta: (id: string) =>
    request<null>(`/sow/alertas/${id}`, { method: "DELETE" }),

  // ── Dashboard / indicadores / histórico / score ──
  getDashboard: (params: SoWScopeParams = {}) =>
    request<SoWDashboard>(`/sow/dashboard${qs(params)}`),
  getIndicadores: (params: SoWScopeParams = {}) =>
    request<SoWIndicadores>(`/sow/indicadores${qs(params)}`),
  getHistoricoShare: (params: SoWScopeParams & { clienteId?: string; meses?: number } = {}) =>
    request<{ pontos: SoWShareSnapshot[] }>(`/sow/historico/share${qs(params)}`),
  getScore: (params: SoWScopeParams = {}) =>
    request<SoWCliente[]>(`/sow/score${qs(params)}`),

  // ── Liderança ──
  // 403 para SELLER: a aba nem aparece para ele, mas a rota é a fronteira real.
  getEquipe: () => request<SoWEquipe>("/sow/equipe"),

  // ── IA ──
  // Vários extratos vão numa requisição só: o backend consolida por instituição
  // numa única análise da IA, em vez de N importações que se sobrescreveriam.
  importarCarteira: async (clienteId: string, files: File[]): Promise<SoWImportJob> => {
    const fd = new FormData();
    for (const file of files) fd.append("arquivos", file);
    fd.append("clienteId", clienteId);
    const res = await fetch(`${API_URL}/sow/ai/import-carteira`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Falha ao processar a carteira");
    }
    return res.json();
  },
  getImportJob: (id: string) => request<SoWImportJob>(`/sow/ai/import-jobs/${id}`),
  gerarAlertas: (clienteId: string) =>
    request<SoWAlerta[]>(`/sow/ai/clientes/${clienteId}/alertas`, { method: "POST" }),
  gerarOportunidades: (clienteId: string) =>
    request<SoWOportunidade[]>(`/sow/ai/clientes/${clienteId}/oportunidades`, { method: "POST" }),
  gerarScore: (clienteId: string) =>
    request<SoWCliente>(`/sow/ai/clientes/${clienteId}/score`, { method: "POST" }),
  gerarFollowUp: (clienteId: string, body: { oportunidadeId?: string; canal?: string; tom?: string } = {}) =>
    request<{ texto: string }>(`/sow/ai/clientes/${clienteId}/follow-up`, { method: "POST", body }),
  // Última análise salva, ou null se nunca foi gerada. CUSTO ZERO — é o que a
  // aba IA chama ao abrir, para não pagar outra geração de Opus só para reler.
  getAnaliseCarteira: (clienteId: string) =>
    request<SoWAnaliseCarteira | null>(`/sow/ai/clientes/${clienteId}/analise`),
  // Substituiu o antigo "briefing de reunião". Além do relatório em Markdown,
  // grava o comentário individual de cada ativo comentado (por isso o hook
  // invalida as queries — a tabela de Ativos muda com isso) e persiste o
  // relatório. Devolve o MESMO shape do GET, para a mutation escrever direto no
  // cache sem um refetch logo depois de uma chamada de ~60s.
  analisarCarteira: (clienteId: string) =>
    request<SoWAnaliseCarteira>(`/sow/ai/clientes/${clienteId}/analise`, { method: "POST" }),
};
