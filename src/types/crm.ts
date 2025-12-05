export type Cadencia = 'Semanal' | 'Quinzenal' | 'Mensal';
export type Status = 'Atrasado' | 'Falar Hoje' | 'Em Dia' | 'Convertido';
export type Temperatura = 'Frio' | 'Morno' | 'Quente';
export type Prioridade = 'Urgente' | 'Alerta' | 'Atenção' | 'Normal';
export type Origem = 'Instagram' | 'Indicação' | 'Anúncio' | 'Evento' | 'WhatsApp' | 'Orgânico' | 'LinkedIn' | 'Site' | 'Outro';
export type TipoContato = 'Ligação' | 'WhatsApp' | 'Email' | 'Reunião' | 'Visita' | 'Outro';

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
  nome: string;
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
  score: number;
  dataEntrada: Date;
  dataConversao: Date | null;
  historico: HistoricoContato[];
  pontos: number;
  nivel: string;
  conquistas: string[];
}

export interface Gamificacao {
  pontosHoje: number;
  pontosSemana: number;
  pontosMes: number;
  nivel: string;
  conquistas: string[];
  missoesDiarias: MissaoDiaria[];
  progressoDiario: number;
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
