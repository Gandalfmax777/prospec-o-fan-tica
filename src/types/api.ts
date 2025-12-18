import { Lead, Gamificacao, MetricasDiarias, Briefing, Temperatura } from './crm';

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

