import type {
  CreateLeadInput,
  UpdateLeadInput,
  BriefingInput,
  CreateBriefingInput,
  UpdateGamificacaoInput,
  UpdateMetricasInput,
  LeadResponse,
} from "@/types/api";
import type { Gamificacao, MetricasDiarias, Briefing } from "@/types/crm";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333/api";

async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
    ...options,
  };

  if (
    config.body &&
    typeof config.body === "object" &&
    !(config.body instanceof FormData)
  ) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Erro desconhecido" }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) {
      return null as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export const api = {
  // Leads
  getLeads: (): Promise<LeadResponse[]> => request<LeadResponse[]>("/leads"),
  getLead: (id: string): Promise<LeadResponse> =>
    request<LeadResponse>(`/leads/${id}`),
  createLead: (lead: CreateLeadInput): Promise<LeadResponse> =>
    request<LeadResponse>("/leads", { method: "POST", body: lead }),
  updateLead: (id: string, updates: UpdateLeadInput): Promise<LeadResponse> =>
    request<LeadResponse>(`/leads/${id}`, { method: "PUT", body: updates }),
  deleteLead: (id: string): Promise<null> =>
    request<null>(`/leads/${id}`, { method: "DELETE" }),
  registrarContato: (
    id: string,
    briefing?: BriefingInput
  ): Promise<LeadResponse> =>
    request<LeadResponse>(`/leads/${id}/contato`, {
      method: "POST",
      body: { briefing },
    }),

  // Gamificação
  getGamificacao: (): Promise<Gamificacao> =>
    request<Gamificacao>("/gamificacao"),
  updateGamificacao: (data: UpdateGamificacaoInput): Promise<Gamificacao> =>
    request<Gamificacao>("/gamificacao", { method: "PUT", body: data }),
  adicionarPontos: (pontos: number): Promise<Gamificacao> =>
    request<Gamificacao>("/gamificacao/pontos", {
      method: "POST",
      body: { pontos },
    }),
  completarMissao: (id: string): Promise<Gamificacao> =>
    request<Gamificacao>(`/gamificacao/missoes/${id}`, { method: "PUT" }),

  // Métricas
  getMetricas: (): Promise<MetricasDiarias> =>
    request<MetricasDiarias>("/metricas"),
  updateMetricas: (data: UpdateMetricasInput): Promise<MetricasDiarias> =>
    request<MetricasDiarias>("/metricas", { method: "PUT", body: data }),

  // Briefings
  createBriefing: (briefing: CreateBriefingInput): Promise<Briefing> =>
    request<Briefing>("/briefings", { method: "POST", body: briefing }),
  getBriefingsByLead: (leadId: string): Promise<Briefing[]> =>
    request<Briefing[]>(`/briefings/lead/${leadId}`),
};
