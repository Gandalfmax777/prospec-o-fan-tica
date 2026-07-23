import {
  fromApiPrioridade,
  fromApiStatus,
  fromApiTipoContato,
  toApiPrioridade,
  toApiStatus,
  toApiTipoContato,
} from "@/lib/enumMaps";
import { ensureHttpsInProduction } from "@/lib/utils";
import type {
  BriefingInput,
  CreateBriefingInput,
  CreateInviteInput,
  CreateLeadInput,
  CreateOrgInput,
  JoinOrgInput,
  LeadResponse,
  LeaderTeamMember,
  LeaderSummary,
  MeResponse,
  AdminUser,
  OrgDetails,
  OrgInvite,
  MyPendingInvite,
  OrgMember,
  UpdateUserRoleInput,
  UpdateGamificacaoInput,
  UpdateLeadInput,
  UpdateMetricasInput,
  SellerDetails,
  SysAdminStats,
  SysAdminOrg,
  SysAdminMember,
  SysAdminUser,
} from "@/types/api";
import type { Briefing, Gamificacao, MetricasDiarias, PerdidoLead } from "@/types/crm";

const API_URL = ensureHttpsInProduction(
  import.meta.env.VITE_API_URL || "http://localhost:3333/api"
);

const normalizeLeadInput = <T extends { status?: string; prioridade?: string }>(
  data: T
): T => ({
  ...data,
  status: toApiStatus(data.status),
  prioridade: toApiPrioridade(data.prioridade),
});

const normalizeBriefingInput = <T extends { tipoContato?: string }>(
  data?: T
): T | undefined => {
  if (!data) return data;
  return {
    ...data,
    tipoContato: toApiTipoContato(data.tipoContato),
  };
};

const normalizeLeadResponse = (lead: LeadResponse): LeadResponse => ({
  ...lead,
  status: fromApiStatus(lead.status) ?? lead.status,
  prioridade: fromApiPrioridade(lead.prioridade) ?? lead.prioridade,
  historico:
    lead.historico?.map((item) => ({
      ...item,
      tipo: fromApiTipoContato(item.tipo) ?? item.tipo,
      status: fromApiStatus(item.status) ?? item.status,
    })) ?? lead.historico,
  briefings:
    lead.briefings?.map((item) => ({
      ...item,
      tipoContato: fromApiTipoContato(item.tipoContato) ?? item.tipoContato,
    })) ?? lead.briefings,
});

const normalizeBriefingResponse = <T extends { tipoContato: string }>(data: T): T => ({
  ...data,
  tipoContato: fromApiTipoContato(data.tipoContato) ?? data.tipoContato,
});

/**
 * Helper para verificar se erro é de sessão inválida
 */
function isSessionInvalidError(error: unknown, status?: number): boolean {
  if (status === 401) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("sessão inválida") ||
      message.includes("sessao invalida") ||
      message.includes("não autenticado") ||
      message.includes("nao autenticado") ||
      message.includes("not authenticated") ||
      message.includes("unauthorized") ||
      message.includes("401")
    );
  }
  return false;
}

/**
 * Verifica se o erro é de rede/timeout (servidor inacessível)
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("failed to fetch") ||
      msg.includes("network") ||
      msg.includes("timeout") ||
      msg.includes("aborted") ||
      msg.includes("err_connection") ||
      msg.includes("load failed")
    );
  }
  return false;
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0,
  maxRetries = 1
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
      
      const errorMessage = error.error || `HTTP error! status: ${response.status}`;
      const apiError = new Error(errorMessage);
      
      // Se for erro 401 (não autenticado) e ainda há retries disponíveis, tenta novamente
      // Isso dá uma chance para cookies serem processados (útil no Safari iOS)
      if (response.status === 401 && retryCount < maxRetries) {
        console.warn(`Erro 401 detectado, tentando novamente (${retryCount + 1}/${maxRetries})...`);
        // Aguarda um pouco antes de tentar novamente (dá tempo para cookies serem processados)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return request<T>(endpoint, options, retryCount + 1, maxRetries);
      }
      
      throw apiError;
    }

    if (response.status === 204) {
      return null as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    // Se for erro de sessão inválida e ainda há retries disponíveis, tenta novamente
    if (isSessionInvalidError(error) && retryCount < maxRetries) {
      console.warn(`Erro de autenticação detectado, tentando novamente (${retryCount + 1}/${maxRetries})...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return request<T>(endpoint, options, retryCount + 1, maxRetries);
    }

    // Erro de rede (timeout, conexão instável, etc.) — retry com backoff
    if (isNetworkError(error) && retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
      console.warn(`Erro de rede na API, tentando novamente em ${delay}ms (${retryCount + 1}/${maxRetries})...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return request<T>(endpoint, options, retryCount + 1, maxRetries);
    }

    console.error("API Error:", error);
    throw error;
  }
}

export const api = {
  getMe: (): Promise<MeResponse> => request<MeResponse>("/me"),

  // Leads
  getLeads: async (): Promise<LeadResponse[]> => {
    const leads = await request<LeadResponse[]>("/leads");
    return leads.map(normalizeLeadResponse);
  },
  getLead: async (id: string): Promise<LeadResponse> => {
    const lead = await request<LeadResponse>(`/leads/${id}`);
    return normalizeLeadResponse(lead);
  },
  createLead: async (lead: CreateLeadInput): Promise<LeadResponse> => {
    const normalizedLead = normalizeLeadInput(lead);
    const created = await request<LeadResponse>("/leads", {
      method: "POST",
      body: normalizedLead,
    });
    return normalizeLeadResponse(created);
  },
  updateLead: async (
    id: string,
    updates: UpdateLeadInput
  ): Promise<LeadResponse> => {
    const normalizedUpdates = normalizeLeadInput(updates);
    const updated = await request<LeadResponse>(`/leads/${id}`, {
      method: "PUT",
      body: normalizedUpdates,
    });
    return normalizeLeadResponse(updated);
  },
  deleteLead: (id: string): Promise<null> =>
    request<null>(`/leads/${id}`, { method: "DELETE" }),
  registrarContato: async (
    id: string,
    briefing?: BriefingInput
  ): Promise<LeadResponse> => {
    const normalizedBriefing = normalizeBriefingInput(briefing);
    const updated = await request<LeadResponse>(`/leads/${id}/contato`, {
      method: "POST",
      body: { briefing: normalizedBriefing },
    });
    return normalizeLeadResponse(updated);
  },

  // ─── Leads Perdidos (pool compartilhado) ──────────────────────────────────
  // Marca o próprio lead como perdido (entra no pool org-wide).
  marcarLeadPerdido: async (id: string, motivo?: string | null): Promise<LeadResponse> => {
    const updated = await request<LeadResponse>(`/leads/${id}/perdido`, {
      method: "POST",
      body: { motivo: motivo ?? null },
    });
    return normalizeLeadResponse(updated);
  },
  // Lista org-wide de perdidos (qualquer assessor da org vê todos).
  getPerdidos: async (): Promise<PerdidoLead[]> => {
    const list = await request<PerdidoLead[]>("/leads/perdidos");
    return list.map((p) => ({
      ...p,
      dataPerda: p.dataPerda ? new Date(p.dataPerda) : null,
      dataEntrada: new Date(p.dataEntrada),
      ultimoBriefing: p.ultimoBriefing
        ? { ...p.ultimoBriefing, data: new Date(p.ultimoBriefing.data) }
        : null,
    }));
  },
  // Assume um lead perdido para si (rotação): reatribui o dono e revive ao funil.
  assumirLead: async (id: string): Promise<LeadResponse> => {
    const updated = await request<LeadResponse>(`/leads/${id}/assumir`, {
      method: "POST",
    });
    return normalizeLeadResponse(updated);
  },
  // Baixa o PDF do pool de perdidos (blob — o wrapper request só faz JSON).
  exportPerdidosPdf: async (): Promise<void> => {
    const res = await fetch(`${API_URL}/leads/perdidos/pdf`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Falha ao gerar o PDF de perdidos");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads-perdidos.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

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
  createBriefing: async (briefing: CreateBriefingInput): Promise<Briefing> => {
    const normalizedBriefing = normalizeBriefingInput(briefing) ?? briefing;
    const created = await request<Briefing>("/briefings", {
      method: "POST",
      body: normalizedBriefing,
    });
    return normalizeBriefingResponse(created);
  },
  getBriefingsByLead: async (leadId: string): Promise<Briefing[]> => {
    const briefings = await request<Briefing[]>(
      `/briefings/lead/${leadId}`
    );
    return briefings.map(normalizeBriefingResponse);
  },
  getLeaderTeam: (): Promise<LeaderTeamMember[]> =>
    request<LeaderTeamMember[]>("/leader/team"),
  getLeaderSummary: (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<LeaderSummary> => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<LeaderSummary>(`/leader/summary${suffix}`);
  },
  getSellerDetails: (sellerId: string): Promise<SellerDetails> => {
    const details = request<SellerDetails>(`/leader/seller/${sellerId}`);
    return details.then((data) => ({
      ...data,
      leads: data.leads.map(normalizeLeadResponse),
    }));
  },

  // Admin
  getAdminUsers: (): Promise<AdminUser[]> => request<AdminUser[]>("/admin/users"),
  updateUserRole: (userId: string, input: UpdateUserRoleInput): Promise<AdminUser> =>
    request<AdminUser>(`/admin/users/${userId}/role`, {
      method: "PATCH",
      body: input,
    }),

  // Organização
  createOrg: (data: CreateOrgInput): Promise<OrgDetails> =>
    request<OrgDetails>("/organizations", { method: "POST", body: data }),

  joinOrg: (data: JoinOrgInput): Promise<{ message: string; organization: { id: string; name: string; slug: string } }> =>
    request("/organizations/join", { method: "POST", body: data }),

  getOrg: (): Promise<OrgDetails> =>
    request<OrgDetails>("/organizations/me"),

  renameOrg: (name: string): Promise<{ id: string; name: string; slug: string }> =>
    request("/organizations/me", { method: "PUT", body: { name } }),

  getOrgMembers: (): Promise<OrgMember[]> =>
    request<OrgMember[]>("/organizations/me/members"),

  removeOrgMember: (userId: string): Promise<null> =>
    request<null>(`/organizations/me/members/${userId}`, { method: "DELETE" }),

  getOrgInvites: (): Promise<OrgInvite[]> =>
    request<OrgInvite[]>("/organizations/me/invites"),

  createOrgInvite: (data: CreateInviteInput): Promise<OrgInvite> =>
    request<OrgInvite>("/organizations/me/invites", { method: "POST", body: data }),

  cancelOrgInvite: (id: string): Promise<null> =>
    request<null>(`/organizations/me/invites/${id}`, { method: "DELETE" }),

  resendOrgInvite: (id: string): Promise<{ id: string; email: string; emailSent: boolean }> =>
    request(`/organizations/me/invites/${id}/resend`, { method: "POST" }),

  getMyPendingInvite: (): Promise<MyPendingInvite | null> =>
    request<MyPendingInvite | null>("/organizations/my-pending-invite"),

  // Org switcher
  switchOrganization: (organizationId: string): Promise<{ organization: { id: string; name: string; slug: string }; role: string }> =>
    request("/me/active-organization", { method: "PUT", body: JSON.stringify({ organizationId }) }),

  // Sysadmin
  sysadmin: {
    getStats: (): Promise<SysAdminStats> =>
      request<SysAdminStats>("/sysadmin/stats"),

    getOrgs: (): Promise<SysAdminOrg[]> =>
      request<SysAdminOrg[]>("/sysadmin/organizations"),

    createOrg: (name: string): Promise<SysAdminOrg> =>
      request<SysAdminOrg>("/sysadmin/organizations", { method: "POST", body: { name } }),

    deleteOrg: (id: string): Promise<null> =>
      request<null>(`/sysadmin/organizations/${id}`, { method: "DELETE" }),

    getOrgMembers: (orgId: string): Promise<SysAdminMember[]> =>
      request<SysAdminMember[]>(`/sysadmin/organizations/${orgId}/members`),

    getOrgInvites: (orgId: string): Promise<OrgInvite[]> =>
      request<OrgInvite[]>(`/sysadmin/organizations/${orgId}/invites`),

    createOrgInvite: (orgId: string, email: string, role: string): Promise<OrgInvite> =>
      request<OrgInvite>(`/sysadmin/organizations/${orgId}/invites`, {
        method: "POST",
        body: { email, role },
      }),

    cancelOrgInvite: (orgId: string, inviteId: string): Promise<null> =>
      request<null>(`/sysadmin/organizations/${orgId}/invites/${inviteId}`, { method: "DELETE" }),

    resendOrgInvite: (orgId: string, inviteId: string): Promise<{ id: string; email: string; emailSent: boolean }> =>
      request(`/sysadmin/organizations/${orgId}/invites/${inviteId}/resend`, { method: "POST" }),

    getUsers: (): Promise<SysAdminUser[]> =>
      request<SysAdminUser[]>("/sysadmin/users"),
  },
};
