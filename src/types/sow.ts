// Tipos do módulo Share of Wallet (SoW).
// O backend já devolve valores prontos p/ UI: números em reais, datas ISO
// (string) e enums com rótulos acentuados. Datas ficam como string; componentes
// formatam com date-fns quando necessário.

export type SoWClienteStatus =
  | "Prospect"
  | "Ativo"
  | "Em Negociação"
  | "Convertido"
  | "Inativo"
  | "Perdido";

export type SoWTipoAtivo =
  | "CDB" | "LCA" | "LCI" | "Debênture" | "Tesouro" | "Fundo"
  | "Fundo Imobiliário" | "Ação" | "COE" | "Previdência"
  | "Renda Fixa Internacional" | "Cripto" | "Poupança" | "Outros";

export type SoWAtivoStatus = "Ativo" | "Resgatado" | "Vencido" | "Em Movimentação";

export type SoWSeveridade = "Baixa" | "Média" | "Alta" | "Crítica";
export type SoWUrgencia = "Baixa" | "Média" | "Alta";
export type SoWStatusOportunidade =
  | "Aberta" | "Em Negociação" | "Ganha" | "Perdida" | "Descartada";
export type SoWTipoEvento =
  | "Vencimento" | "Aporte" | "Resgate" | "Movimentação"
  | "Contato" | "Oportunidade" | "Alerta" | "Outro";

export interface SoWCliente {
  id: string;
  leadId: string | null;
  nome: string;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  codigo: string | null;
  assessorId: string;
  status: SoWClienteStatus;
  metaSharePct: number;
  probabilidadeConcentracao: number | null;
  ultimoContato: string | null;
  proximoContato: string | null;
  scoreValor: number | null;
  scoreProbabilidade: number | null;
  scoreMotivos: string[];
  scoreAtualizadoEm: string | null;
  patrimonioTotal: number;
  patrimonioInterno: number;
  patrimonioExterno: number;
  sharePct: number;
  gap: number;
  cacheAtualizadoEm: string | null;
  createdAt: string;
  updatedAt: string;
  instituicoes?: SoWInstituicao[];
  ativos?: SoWAtivo[];
}

export interface SoWInstituicaoCatalogo {
  id: string;
  nome: string;
  interna: boolean;
  ativo: boolean;
  ordem: number;
}

export interface SoWInstituicao {
  id: string;
  clienteId: string;
  catalogoId: string | null;
  nome: string;
  interna: boolean;
  valorInformado: number | null;
  observacoes: string | null;
  responsavel: string | null;
  dataAtualizacao: string | null;
  createdAt: string;
  updatedAt: string;
  ativos?: SoWAtivo[];
}

export interface SoWAtivo {
  id: string;
  clienteId: string;
  instituicaoId: string;
  tipo: SoWTipoAtivo;
  nome: string;
  valorAplicado: number;
  valorAtual: number | null;
  rentabilidade: string | null;
  dataAplicacao: string | null;
  vencimento: string | null;
  liquidez: string | null;
  custodia: string | null;
  observacoes: string | null;
  status: SoWAtivoStatus;
  /** Importação que criou o ativo; null = cadastrado à mão. */
  importJobId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SoWEventoTimeline {
  id: string;
  clienteId: string;
  data: string;
  tipo: SoWTipoEvento;
  valor: number | null;
  descricao: string;
  ativoId: string | null;
  instituicaoId: string | null;
  geradoIA: boolean;
  origem: "evento" | "vencimento";
}

export interface SoWOportunidade {
  id: string;
  clienteId: string;
  clienteNome: string | null;
  assessorId: string | null;
  ativoId: string | null;
  instituicao: string | null;
  valor: number | null;
  chancePct: number | null;
  urgencia: SoWUrgencia;
  prazo: string | null;
  diasRestantes: number | null;
  sugestaoIA: string | null;
  status: SoWStatusOportunidade;
  geradoIA: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SoWAlerta {
  id: string;
  clienteId: string;
  clienteNome: string | null;
  tipo: string;
  mensagem: string;
  severidade: SoWSeveridade;
  geradoIA: boolean;
  resolvido: boolean;
  resolvidoEm: string | null;
  ativoId: string | null;
  instituicaoId: string | null;
  createdAt: string;
}

export interface SoWDashboard {
  patrimonioTotal: number;
  patrimonioInterno: number;
  patrimonioExterno: number;
  shareAtualPct: number;
  metaSharePct: number;
  gap: number;
  numClientes: number;
  patrimonioMonitorado: number;
  patrimonioCaptavel: number;
  patrimonioEmNegociacao: number;
  valorConvertido: number;
  taxaMediaSharePct: number;
  evolucaoMensal: { mes: string; sharePct: number; patrimonio: number }[];
}

export interface SoWIndicadores {
  porTipo: { tipo: string; total: number }[];
  porInstituicao: { nome: string; total: number; interna: boolean }[];
  internoVsExterno: { interno: number; externo: number };
  vencimentosPorMes: { mes: string; total: number }[];
}

export interface SoWShareSnapshot {
  ano: number;
  mes: number;
  sharePct: number;
  patrimonioTotal: number;
  patrimonioInterno: number;
  patrimonioExterno: number;
}

export interface SoWImportJob {
  id: string;
  clienteId: string | null;
  tipoArquivo: string;
  nomeArquivo: string | null;
  status: "Pendente" | "Processando" | "Concluido" | "Falhou";
  resultado: unknown | null;
  erro: string | null;
  modeloIA: string | null;
  tokensUsados: number | null;
  createdAt: string;
  concluidoEm: string | null;
}

// ── inputs ──
export interface CreateClienteInput {
  nome: string;
  email?: string | null;
  telefone?: string | null;
  cidade?: string | null;
  codigo?: string | null;
  status?: SoWClienteStatus;
  metaSharePct?: number;
}
export type UpdateClienteInput = Partial<CreateClienteInput> & { assessorId?: string };

export interface CreateInstituicaoInput {
  nome: string;
  catalogoId?: string | null;
  interna?: boolean;
  valorInformado?: number | null;
  observacoes?: string | null;
  responsavel?: string | null;
}

export interface CreateAtivoInput {
  tipo: SoWTipoAtivo;
  nome: string;
  valorAplicado: number;
  valorAtual?: number | null;
  rentabilidade?: string | null;
  dataAplicacao?: string | null;
  vencimento?: string | null;
  liquidez?: string | null;
  custodia?: string | null;
  observacoes?: string | null;
  status?: SoWAtivoStatus;
}
