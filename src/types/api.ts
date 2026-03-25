import { Lead, Gamificacao, MetricasDiarias, Briefing } from './crm';

export interface CreateLeadInput {
  nome: string;
  cidade: string;
  origem: string;
  telefone: string;
  codigo: string;
  cadencia: string;
  ultimoContato?: string | Date | null;
  observacao?: string;
  temperatura?: string;
  estimatedValueCents?: number | null;
  statedValueCents?: number | null;
  currency?: string;
}

export interface UpdateLeadInput {
  nome?: string;
  cidade?: string;
  origem?: string;
  telefone?: string;
  codigo?: string;
  cadencia?: string;
  ultimoContato?: string | Date | null;
  proximoContato?: string | Date | null;
  status?: string;
  temperatura?: string;
  observacao?: string;
  prioridade?: string;
  dataConversao?: string | Date | null;
  estimatedValueCents?: number | null;
  statedValueCents?: number | null;
  currency?: string;
}

export interface BriefingInput {
  tipoContato?: string;
  objetivo?: string;
  conversa?: string;
  resultado?: string;
  interesseDemonstrado?: string;
  objecoes?: string;
  proximoPasso?: string;
  proximoFollowUp?: string | Date | null;
  temperaturaAtualizada?: string;
}

export interface CreateBriefingInput {
  leadId: string;
  tipoContato: string;
  objetivo?: string;
  conversa?: string;
  resultado?: string;
  interesseDemonstrado?: string;
  objecoes?: string;
  proximoPasso?: string;
  proximoFollowUp?: string | Date | null;
  temperaturaAtualizada: string;
}

export interface UpdateGamificacaoInput {
  pontosHoje?: number;
  pontosSemana?: number;
  pontosMes?: number;
  nivel?: string;
  conquistas?: string[];
  progressoDiario?: number;
}

export interface UpdateMetricasInput {
  contatosFeitos?: number;
  atrasosResolvidos?: number;
  novosLeads?: number;
  leadsQuentesTrabalhados?: number;
  taxaRitmo?: number;
}

export interface LeaderSummary {
  totals: {
    leadsCount: number;
    convertedCount: number;
    totalEstimatedValueCents: number;
    totalStatedValueCents: number;
  };
  breakdown: Array<{
    sellerId: string;
    sellerName: string;
    leadsCount: number;
    convertedCount: number;
    totalStatedValueCents: number;
  }>;
}

export interface LeaderTeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export interface OrgMembership {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface MeResponse {
  id: string;
  email: string;
  name: string | null;
  role: string;
  managerId: string | null;
  organizationId?: string | null;
  organization?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  organizations: OrgMembership[];
}

export interface CrmConfig {
  id: string;
  crmApiUrl: string;
  crmApiKey: string | null;
  defaultPipelineStageId: string | null;
  autoTransfer: boolean;
  lastTestedAt: string | null;
  lastTestSuccess: boolean | null;
  updatedAt?: string;
}

export interface SaveCrmConfigInput {
  crmApiUrl: string;
  crmApiKey?: string;
  defaultPipelineStageId?: string | null;
  autoTransfer?: boolean;
}

export interface TransferLeadResult {
  success: boolean;
  contactId?: string;
  dealId?: string;
  dealUrl?: string | null;
  transferredAt?: string;
}

// ─── Organização ──────────────────────────────────────────────────────────────

export interface OrgDetails {
  id: string;
  name: string;
  slug: string;
  membersCount: number;
  leadsCount: number;
  crmConfig: {
    id: string;
    crmApiUrl: string;
    autoTransfer: boolean;
    lastTestedAt: string | null;
    lastTestSuccess: boolean | null;
  } | null;
  createdAt: string;
}

export interface OrgMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  managerId: string | null;
  createdAt: string;
}

export interface OrgInvite {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateInviteInput {
  email: string;
  role: string;
}

export interface CreateOrgInput {
  name: string;
}

export interface JoinOrgInput {
  token: string;
}

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  managerId: string | null;
}

export interface UpdateUserRoleInput {
  role: string;
  managerId?: string | null;
}

export interface LeadResponse extends Lead {
  historico: Array<{
    id: string;
    data: string;
    tipo: string;
    temperatura: string;
    status: string;
    resumo: string;
    proximoPasso: string;
    responsavel: string;
  }>;
  briefings: Array<{
    id: string;
    data: string;
    tipoContato: string;
    objetivo: string;
    conversa: string;
    resultado: string;
    interesseDemonstrado: string;
    objecoes: string;
    proximoPasso: string;
    proximoFollowUp: string | null;
    temperaturaAtualizada: string;
  }>;
}

export interface SellerDetails {
  seller: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  metrics: {
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    totalStatedValueCents: number;
    totalEstimatedValueCents: number;
    leadsByStatus: Record<string, number>;
    leadsByOrigin: Array<{ origin: string; count: number }>;
    leadsByCity: Array<{ city: string; count: number }>;
    leadsByCadence: Array<{ cadence: string; count: number }>;
  };
  leads: LeadResponse[];
  timelineData: Array<{
    date: string;
    leadsCount: number;
    convertedCount: number;
  }>;
  recentActivity: Array<{
    type: 'contact' | 'briefing' | 'conversion';
    date: string;
    leadId: string;
    leadName: string;
    description: string;
  }>;
}
