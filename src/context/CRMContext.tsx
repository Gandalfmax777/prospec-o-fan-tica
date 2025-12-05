import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Lead, Cadencia, Status, Temperatura, Prioridade, Origem, HistoricoContato, Briefing, Gamificacao, MissaoDiaria, MetricasDiarias, TipoContato } from '@/types/crm';
import { addDays, isToday, isBefore, startOfDay, differenceInDays, startOfWeek, startOfMonth, isWithinInterval, endOfWeek, endOfMonth } from 'date-fns';

interface CRMContextType {
  leads: Lead[];
  gamificacao: Gamificacao;
  metricasDiarias: MetricasDiarias;
  addLead: (lead: Omit<Lead, 'id' | 'proximoContato' | 'status' | 'prioridade' | 'score' | 'historico' | 'pontos' | 'nivel' | 'conquistas'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  registrarContato: (id: string, briefing?: Partial<Briefing>) => void;
  moverTemperatura: (id: string, novaTemperatura: Temperatura) => void;
  converterLead: (id: string) => void;
  retornarAoFunil: (id: string) => void;
  adicionarBriefing: (leadId: string, briefing: Omit<Briefing, 'id' | 'leadId' | 'data'>) => void;
  completarMissao: (missaoId: string) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const calcularProximoContato = (ultimoContato: Date | null, cadencia: Cadencia): Date | null => {
  if (!ultimoContato) return null;
  const dias = cadencia === 'Semanal' ? 7 : cadencia === 'Quinzenal' ? 15 : 30;
  return addDays(ultimoContato, dias);
};

const calcularStatus = (proximoContato: Date | null): Status => {
  if (!proximoContato) return 'Em Dia';
  const hoje = startOfDay(new Date());
  const proximo = startOfDay(proximoContato);
  
  if (isBefore(proximo, hoje)) return 'Atrasado';
  if (isToday(proximoContato)) return 'Falar Hoje';
  return 'Em Dia';
};

const calcularPrioridade = (status: Status, proximoContato: Date | null): Prioridade => {
  if (status === 'Atrasado') return 'Urgente';
  if (!proximoContato) return 'Normal';
  
  const diasAte = differenceInDays(startOfDay(proximoContato), startOfDay(new Date()));
  if (diasAte <= 0) return 'Urgente';
  if (diasAte <= 2) return 'Alerta';
  if (isToday(proximoContato)) return 'Atenção';
  return 'Normal';
};

const calcularScore = (lead: Partial<Lead>): number => {
  let score = 0;
  if (lead.status === 'Atrasado') score += 5;
  if (lead.prioridade === 'Alerta') score += 3;
  if (lead.temperatura === 'Quente') score += 3;
  if (['Indicação', 'Evento'].includes(lead.origem || '')) score += 2;
  if (lead.observacao && lead.observacao.toLowerCase().includes('interesse')) score += 2;
  return score;
};

const calcularNivel = (pontos: number): string => {
  if (pontos >= 600) return 'Closer';
  if (pontos >= 301) return 'Cadência Master';
  if (pontos >= 151) return 'Consistente';
  if (pontos >= 51) return 'Persistente';
  return 'Prospectador Iniciante';
};

const gerarMissoesDiarias = (): MissaoDiaria[] => [
  { id: '1', descricao: 'Falar com 5 leads', meta: 5, progresso: 0, concluida: false, pontos: 5 },
  { id: '2', descricao: 'Esquentar 2 leads', meta: 2, progresso: 0, concluida: false, pontos: 5 },
  { id: '3', descricao: 'Resolver todos atrasados', meta: 1, progresso: 0, concluida: false, pontos: 10 },
];

const leadsIniciais: Lead[] = [
  {
    id: '1',
    nome: 'João Silva',
    cidade: 'São Paulo',
    origem: 'Instagram',
    telefone: '(11) 99999-1234',
    codigo: 'SP001',
    cadencia: 'Semanal',
    ultimoContato: addDays(new Date(), -10),
    proximoContato: addDays(new Date(), -3),
    status: 'Atrasado',
    temperatura: 'Quente',
    observacao: 'Demonstrou muito interesse no produto',
    prioridade: 'Urgente',
    score: 10,
    dataEntrada: addDays(new Date(), -30),
    dataConversao: null,
    historico: [],
    pontos: 45,
    nivel: 'Prospectador Iniciante',
    conquistas: [],
  },
  {
    id: '2',
    nome: 'Maria Santos',
    cidade: 'Rio de Janeiro',
    origem: 'Indicação',
    telefone: '(21) 98888-5678',
    codigo: 'RJ001',
    cadencia: 'Quinzenal',
    ultimoContato: addDays(new Date(), -1),
    proximoContato: addDays(new Date(), 0),
    status: 'Falar Hoje',
    temperatura: 'Morno',
    observacao: 'Pediu mais informações sobre preços',
    prioridade: 'Atenção',
    score: 7,
    dataEntrada: addDays(new Date(), -15),
    dataConversao: null,
    historico: [],
    pontos: 30,
    nivel: 'Prospectador Iniciante',
    conquistas: [],
  },
  {
    id: '3',
    nome: 'Carlos Oliveira',
    cidade: 'Belo Horizonte',
    origem: 'Anúncio',
    telefone: '(31) 97777-9012',
    codigo: 'BH001',
    cadencia: 'Mensal',
    ultimoContato: addDays(new Date(), -5),
    proximoContato: addDays(new Date(), 25),
    status: 'Em Dia',
    temperatura: 'Frio',
    observacao: '',
    prioridade: 'Normal',
    score: 2,
    dataEntrada: addDays(new Date(), -60),
    dataConversao: null,
    historico: [],
    pontos: 15,
    nivel: 'Prospectador Iniciante',
    conquistas: [],
  },
  {
    id: '4',
    nome: 'Ana Costa',
    cidade: 'Curitiba',
    origem: 'WhatsApp',
    telefone: '(41) 96666-3456',
    codigo: 'CT001',
    cadencia: 'Semanal',
    ultimoContato: addDays(new Date(), -2),
    proximoContato: addDays(new Date(), 5),
    status: 'Em Dia',
    temperatura: 'Quente',
    observacao: 'Quer fechar até o final do mês',
    prioridade: 'Normal',
    score: 8,
    dataEntrada: addDays(new Date(), -7),
    dataConversao: null,
    historico: [],
    pontos: 60,
    nivel: 'Persistente',
    conquistas: ['Tempo Real'],
  },
  {
    id: '5',
    nome: 'Pedro Lima',
    cidade: 'Porto Alegre',
    origem: 'LinkedIn',
    telefone: '(51) 95555-7890',
    codigo: 'PA001',
    cadencia: 'Quinzenal',
    ultimoContato: addDays(new Date(), -20),
    proximoContato: addDays(new Date(), -5),
    status: 'Atrasado',
    temperatura: 'Morno',
    observacao: 'Aguardando retorno sobre proposta',
    prioridade: 'Urgente',
    score: 8,
    dataEntrada: addDays(new Date(), -45),
    dataConversao: null,
    historico: [],
    pontos: 25,
    nivel: 'Prospectador Iniciante',
    conquistas: [],
  },
];

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>(leadsIniciais);
  const [gamificacao, setGamificacao] = useState<Gamificacao>({
    pontosHoje: 0,
    pontosSemana: 0,
    pontosMes: 0,
    nivel: 'Prospectador Iniciante',
    conquistas: [],
    missoesDiarias: gerarMissoesDiarias(),
    progressoDiario: 0,
  });
  const [metricasDiarias, setMetricasDiarias] = useState<MetricasDiarias>({
    contatosFeitos: 0,
    atrasosResolvidos: 0,
    novosLeads: 0,
    leadsQuentesTrabalhados: 0,
    taxaRitmo: 0,
  });

  const adicionarPontos = useCallback((pontos: number) => {
    setGamificacao(prev => ({
      ...prev,
      pontosHoje: prev.pontosHoje + pontos,
      pontosSemana: prev.pontosSemana + pontos,
      pontosMes: prev.pontosMes + pontos,
      nivel: calcularNivel(prev.pontosMes + pontos),
    }));
  }, []);

  const addLead = useCallback((leadData: Omit<Lead, 'id' | 'proximoContato' | 'status' | 'prioridade' | 'score' | 'historico' | 'pontos' | 'nivel' | 'conquistas'>) => {
    const proximoContato = calcularProximoContato(leadData.ultimoContato, leadData.cadencia);
    const status = calcularStatus(proximoContato);
    const prioridade = calcularPrioridade(status, proximoContato);
    
    const novoLead: Lead = {
      ...leadData,
      id: Date.now().toString(),
      proximoContato,
      status,
      prioridade,
      score: 0,
      historico: [],
      pontos: 0,
      nivel: 'Prospectador Iniciante',
      conquistas: [],
    };
    novoLead.score = calcularScore(novoLead);
    
    setLeads(prev => [...prev, novoLead]);
    adicionarPontos(2);
    setMetricasDiarias(prev => ({ ...prev, novosLeads: prev.novosLeads + 1 }));
  }, [adicionarPontos]);

  const updateLead = useCallback((id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id !== id) return lead;
      
      const updated = { ...lead, ...updates };
      
      if (updates.ultimoContato || updates.cadencia) {
        updated.proximoContato = calcularProximoContato(
          updates.ultimoContato || lead.ultimoContato,
          updates.cadencia || lead.cadencia
        );
      }
      
      if (updated.status !== 'Convertido') {
        updated.status = calcularStatus(updated.proximoContato);
      }
      updated.prioridade = calcularPrioridade(updated.status, updated.proximoContato);
      updated.score = calcularScore(updated);
      updated.nivel = calcularNivel(updated.pontos);
      
      return updated;
    }));
  }, []);

  const deleteLead = useCallback((id: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
  }, []);

  const registrarContato = useCallback((id: string, briefing?: Partial<Briefing>) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    const wasAtrasado = lead.status === 'Atrasado';
    const hoje = new Date();
    
    const novoHistorico: HistoricoContato = {
      id: Date.now().toString(),
      data: hoje,
      tipo: briefing?.tipoContato || 'Ligação',
      temperatura: lead.temperatura,
      status: lead.status,
      resumo: briefing?.conversa || 'Contato registrado',
      proximoPasso: briefing?.proximoPasso || '',
      responsavel: 'Usuário',
    };

    updateLead(id, {
      ultimoContato: hoje,
      historico: [...lead.historico, novoHistorico],
    });

    adicionarPontos(3);
    setMetricasDiarias(prev => ({
      ...prev,
      contatosFeitos: prev.contatosFeitos + 1,
      atrasosResolvidos: wasAtrasado ? prev.atrasosResolvidos + 1 : prev.atrasosResolvidos,
    }));

    if (wasAtrasado) {
      adicionarPontos(5);
    }
  }, [leads, updateLead, adicionarPontos]);

  const moverTemperatura = useCallback((id: string, novaTemperatura: Temperatura) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    const pontosGanhos = novaTemperatura === 'Quente' ? 5 : novaTemperatura === 'Morno' ? 3 : 0;
    
    updateLead(id, { temperatura: novaTemperatura });
    
    if (pontosGanhos > 0) {
      adicionarPontos(pontosGanhos);
      if (novaTemperatura === 'Quente') {
        setMetricasDiarias(prev => ({
          ...prev,
          leadsQuentesTrabalhados: prev.leadsQuentesTrabalhados + 1,
        }));
      }
    }
  }, [leads, updateLead, adicionarPontos]);

  const converterLead = useCallback((id: string) => {
    updateLead(id, {
      status: 'Convertido',
      dataConversao: new Date(),
    });
    adicionarPontos(10);
  }, [updateLead, adicionarPontos]);

  const retornarAoFunil = useCallback((id: string) => {
    updateLead(id, {
      status: 'Em Dia',
      temperatura: 'Morno',
      dataConversao: null,
    });
  }, [updateLead]);

  const adicionarBriefing = useCallback((leadId: string, briefingData: Omit<Briefing, 'id' | 'leadId' | 'data'>) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const novoHistorico: HistoricoContato = {
      id: Date.now().toString(),
      data: new Date(),
      tipo: briefingData.tipoContato,
      temperatura: briefingData.temperaturaAtualizada,
      status: lead.status,
      resumo: briefingData.conversa,
      proximoPasso: briefingData.proximoPasso,
      responsavel: 'Usuário',
    };

    updateLead(leadId, {
      temperatura: briefingData.temperaturaAtualizada,
      ultimoContato: new Date(),
      historico: [...lead.historico, novoHistorico],
    });

    adicionarPontos(2);
  }, [leads, updateLead, adicionarPontos]);

  const completarMissao = useCallback((missaoId: string) => {
    setGamificacao(prev => {
      const missoes = prev.missoesDiarias.map(m => {
        if (m.id === missaoId && !m.concluida) {
          return { ...m, concluida: true, progresso: m.meta };
        }
        return m;
      });
      
      const missaoConcluida = prev.missoesDiarias.find(m => m.id === missaoId);
      const pontosBonus = missaoConcluida && !missaoConcluida.concluida ? missaoConcluida.pontos : 0;
      
      const todasConcluidas = missoes.every(m => m.concluida);
      const pontosExtras = todasConcluidas ? 20 : 0;
      
      return {
        ...prev,
        missoesDiarias: missoes,
        pontosHoje: prev.pontosHoje + pontosBonus + pontosExtras,
        pontosSemana: prev.pontosSemana + pontosBonus + pontosExtras,
        pontosMes: prev.pontosMes + pontosBonus + pontosExtras,
      };
    });
  }, []);

  useEffect(() => {
    const meta = 10;
    const progresso = metricasDiarias.contatosFeitos + metricasDiarias.atrasosResolvidos;
    setGamificacao(prev => ({
      ...prev,
      progressoDiario: Math.min((progresso / meta) * 100, 100),
    }));
  }, [metricasDiarias]);

  return (
    <CRMContext.Provider value={{
      leads,
      gamificacao,
      metricasDiarias,
      addLead,
      updateLead,
      deleteLead,
      registrarContato,
      moverTemperatura,
      converterLead,
      retornarAoFunil,
      adicionarBriefing,
      completarMissao,
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within CRMProvider');
  }
  return context;
};
