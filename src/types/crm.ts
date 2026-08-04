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

  /**
   * Status COMO GRAVADO no banco. É o que o PUT devolve e o que as declarações
   * do assessor (Converter / Marcar perdido / Assumir) escrevem.
   */
  status: Status;
  /** Prioridade COMO GRAVADA. Mesma regra do `status` acima. */
  prioridade: Prioridade;

  /**
   * Status derivado na leitura: "Atrasado"/"Falar Hoje" quando a data de
   * `proximoContato` já diz isso. A coluna do banco não é recomputada — não há
   * scheduler no backend —, então ela congela no instante da última escrita.
   * Convertido/Perdido são declarações do assessor e sempre ganham da data.
   *
   * Use para EXIBIR, FILTRAR e CONTAR. Nunca mande de volta ao backend: o schema
   * de validação do PUT é `.strict()` e responde 400.
   */
  statusEfetivo: Status;
  /** Prioridade derivada, mesma regra. */
  prioridadeEfetiva: Prioridade;
  /**
   * Dias de calendário até o próximo contato. ASSINADO: NEGATIVO = o follow-up
   * combinado passou há N dias. `null` quando não há `proximoContato`.
   */
  diasAteProximoContato: number | null;

  temperatura: Temperatura;
  observacao: string;
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
