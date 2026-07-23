export type Cadencia = "Diaria" | "Semanal" | "Quinzenal" | "Mensal";
export type Status = "Atrasado" | "Falar Hoje" | "Em Dia" | "Convertido" | "Perdido";
export type Temperatura = "Frio" | "Morno" | "Quente";
export type Prioridade = "Urgente" | "Alerta" | "Atenção" | "Normal";
export type Origem =
  | "WEBSITE"
  | "REFERRAL"
  | "SOCIAL_MEDIA"
  | "EMAIL"
  | "PHONE"
  | "EVENT"
  | "OTHER";
export type TipoContato =
  | "Ligação"
  | "WhatsApp"
  | "Email"
  | "Reunião"
  | "Visita"
  | "Outro";

export interface HistoricoContato {
  id: string;
  data: Date;
  tipo: TipoContato;
  temperatura: Temperatura;
  status: Status;
  resumo: string;
  proximoPasso: string;
  responsavel: string;
}

export interface Briefing {
  id: string;
  leadId: string;
  data: Date;
  tipoContato: TipoContato;
  objetivo: string;
  conversa: string;
  resultado: string;
  interesseDemonstrado: string;
  objecoes: string;
  proximoPasso: string;
  proximoFollowUp: Date | null;
  temperaturaAtualizada: Temperatura;
}

export interface Lead {
  id: string;
  userId: string;
  nome: string;
  email?: string | null;
  cidade: string;
  origem: Origem;
  telefone: string;
  codigo: string;
  cadencia: Cadencia;
  ultimoContato: Date | null;
  proximoContato: Date | null;
  status: Status;
  temperatura: Temperatura;
  observacao: string;
  prioridade: Prioridade;
  estimatedValueCents: number | null;
  statedValueCents: number | null;
  currency: string;
  score: number;
  dataEntrada: Date;
  dataConversao: Date | null;
  // "Lead Lost" — pool de perdidos
  dataPerda?: Date | null;
  motivoPerda?: string | null;
  historico: HistoricoContato[];
  briefings?: Briefing[];
  pontos: number;
  nivel: string;
  conquistas: string[];
}

// Item do pool de perdidos (org-wide) — resposta de GET /leads/perdidos
export interface PerdidoLead {
  id: string;
  nome: string;
  email?: string | null;
  telefone: string;
  cidade: string;
  codigo: string;
  origem: Origem;
  temperatura: Temperatura;
  observacao: string;
  motivoPerda: string | null;
  dataPerda: Date | null;
  dataEntrada: Date;
  ownerId: string;
  ownerName: string;
  isOwner: boolean;
  ultimoBriefing: {
    objetivo: string;
    resultado: string;
    objecoes: string;
    proximoPasso: string;
    data: Date;
  } | null;
}

export interface Gamificacao {
  id: string;
  userId: string;
  pontosHoje: number;
  pontosSemana: number;
  pontosMes: number;
  nivel: string;
  conquistas: string[];
  missoesDiarias: MissaoDiaria[];
  progressoDiario: number;
  ultimaAtividade: Date | null;
}

export interface MissaoDiaria {
  id: string;
  descricao: string;
  meta: number;
  progresso: number;
  concluida: boolean;
  pontos: number;
}

export interface MetricasDiarias {
  id: string;
  userId: string;
  data: Date;
  contatosFeitos: number;
  atrasosResolvidos: number;
  novosLeads: number;
  leadsQuentesTrabalhados: number;
  taxaRitmo: number;
}

export interface DadosDashboard {
  totalProspects: number;
  atrasados: number;
  falarHoje: number;
  emDia: number;
  convertidos: number;
  porCadencia: { cadencia: Cadencia; quantidade: number }[];
  porOrigem: { origem: Origem; quantidade: number }[];
  porTemperatura: { temperatura: Temperatura; quantidade: number }[];
  taxaConversao: number;
  leadsHoje: number;
  leadsSemana: number;
  leadsMes: number;
}
