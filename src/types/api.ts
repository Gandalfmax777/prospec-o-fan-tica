import { Lead, Gamificacao, MetricasDiarias, Briefing } from './crm';

export interface CreateLeadInput {
  nome: string;
  cidade: string;
  origem: string;
  telefone: string;
  /** Opcional no backend (`z.string().optional()`, default `''`) — o formulário de novo lead não preenche. */
  codigo?: string;
  cadencia: string;
  ultimoContato?: string | Date | null;
  /** Enviado pelo CRMContext ao criar; o backend aceita e usa como data de entrada. */
  dataEntrada?: string | Date | null;
  email?: string | null;
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
  /** O CRMContext converte e envia quando o lead traz dataEntrada alterada. */
  dataEntrada?: string | Date | null;
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

// ─── Organização ──────────────────────────────────────────────────────────────

export interface OrgDetails {
  id: string;
  name: string;
  slug: string;
  membersCount: number;
  leadsCount: number;
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
  expiresAt: string;
  createdAt: string;
  /**
   * Indica se o e-mail de convite foi realmente enviado. Retornado na criação
   * do convite; ausente ao listar convites existentes. Quando `false`, a UI
   * avisa e oferece o reenvio.
   */
  emailSent?: boolean;
}

/**
 * Convite pendente do próprio usuário autenticado, retornado por
 * `GET /organizations/my-pending-invite`.
 *
 * Não inclui o token: o link de convite chega exclusivamente por e-mail, e
 * este endpoint é gated apenas por igualdade de e-mail (o cadastro não exige
 * verificação). O dado aqui é informativo — o aceite exige o token do e-mail.
 */
export interface MyPendingInvite {
  id: string;
  role: string;
  expiresAt: string;
  organization: { name: string };
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

/**
 * Lead como vem da API — o formato de fio, antes da conversão para `Lead`.
 *
 * Difere de `Lead` em `historico` e `briefings`: as datas chegam como string e
 * os enums como string crua. Por isso o `Omit`; herdar direto de `Lead` era um
 * extends inválido, já que os tipos desses dois campos são incompatíveis.
 *
 * Use `leadResponseParaLead` (CRMContext) para converter.
 */
export interface LeadResponse extends Omit<Lead, "historico" | "briefings"> {
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

// ─── Sysadmin ─────────────────────────────────────────────────────────────────

export interface SysAdminStats {
  orgCount: number;
  userCount: number;
  pendingInvites: number;
}

export interface SysAdminOrg {
  id: string;
  name: string;
  slug: string;
  membersCount: number;
  leadsCount: number;
  createdAt: string;
}

export interface SysAdminMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  joinedAt: string;
}

export interface SysAdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  /**
   * Nunca foi escrito pelo app até então — toda a base está com `false`.
   * O super-admin faz o backfill manualmente pelo /sysadmin antes de a
   * verificação de e-mail passar a ser exigida.
   */
  emailVerified: boolean;
  organizationId: string | null;
  organizationName: string | null;
  leadsCount: number;
  createdAt: string;
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
