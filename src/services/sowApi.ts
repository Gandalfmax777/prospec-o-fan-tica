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
  SoWIndicadores,
  SoWShareSnapshot,
  SoWImportJob,
  CreateClienteInput,
  UpdateClienteInput,
  CreateInstituicaoInput,
  CreateAtivoInput,
} from "@/types/sow";

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
  getClientes: (params: { scope?: string; assessorId?: string; status?: string; sort?: string } = {}) =>
    request<SoWCliente[]>(`/sow/clientes${qs(params)}`),
  getCliente: (id: string) => request<SoWCliente>(`/sow/clientes/${id}`),
  createCliente: (body: CreateClienteInput) =>
    request<SoWCliente>("/sow/clientes", { method: "POST", body }),
  updateCliente: (id: string, body: UpdateClienteInput) =>
    request<SoWCliente>(`/sow/clientes/${id}`, { method: "PUT", body }),
  deleteCliente: (id: string) =>
    request<null>(`/sow/clientes/${id}`, { method: "DELETE" }),
  importFromLead: (leadId: string) =>
    request<SoWCliente>("/sow/clientes/import-from-lead", { method: "POST", body: { leadId } }),
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
  getOportunidades: (params: { status?: string; urgencia?: string; clienteId?: string } = {}) =>
    request<SoWOportunidade[]>(`/sow/oportunidades${qs(params)}`),
  updateOportunidade: (id: string, body: Partial<SoWOportunidade>) =>
    request<SoWOportunidade>(`/sow/oportunidades/${id}`, { method: "PUT", body }),
  deleteOportunidade: (id: string) =>
    request<null>(`/sow/oportunidades/${id}`, { method: "DELETE" }),

  // ── Alertas ──
  getAlertas: (params: { resolvido?: boolean; severidade?: string; clienteId?: string } = {}) =>
    request<SoWAlerta[]>(`/sow/alertas${qs(params)}`),
  updateAlerta: (id: string, body: { resolvido?: boolean }) =>
    request<SoWAlerta>(`/sow/alertas/${id}`, { method: "PUT", body }),
  deleteAlerta: (id: string) =>
    request<null>(`/sow/alertas/${id}`, { method: "DELETE" }),

  // ── Dashboard / indicadores / histórico / score ──
  getDashboard: (params: { scope?: string; assessorId?: string } = {}) =>
    request<SoWDashboard>(`/sow/dashboard${qs(params)}`),
  getIndicadores: (params: { scope?: string } = {}) =>
    request<SoWIndicadores>(`/sow/indicadores${qs(params)}`),
  getHistoricoShare: (params: { clienteId?: string; meses?: number } = {}) =>
    request<{ pontos: SoWShareSnapshot[] }>(`/sow/historico/share${qs(params)}`),
  getScore: (params: { scope?: string } = {}) =>
    request<SoWCliente[]>(`/sow/score${qs(params)}`),

  // ── IA ──
  importarCarteira: async (clienteId: string, file: File): Promise<SoWImportJob> => {
    const fd = new FormData();
    fd.append("arquivo", file);
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
  gerarBriefing: (clienteId: string) =>
    request<{ texto: string }>(`/sow/ai/clientes/${clienteId}/briefing`, { method: "POST" }),
};
