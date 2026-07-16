import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import {
  Briefing,
  Gamificacao,
  Lead,
  MetricasDiarias,
  MissaoDiaria,
  Temperatura,
} from "@/types/crm";
import type { UpdateLeadInput } from "@/types/api";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";

interface CRMContextType {
  leads: Lead[];
  gamificacao: Gamificacao;
  metricasDiarias: MetricasDiarias;
  loading: boolean;
  error: string | null;
  addLead: (
    lead: Omit<
      Lead,
      | "id"
      | "proximoContato"
      | "status"
      | "prioridade"
      | "score"
      | "historico"
      | "pontos"
      | "nivel"
      | "conquistas"
    >
  ) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  registrarContato: (id: string, briefing?: Partial<Briefing>) => Promise<void>;
  moverTemperatura: (id: string, novaTemperatura: Temperatura) => Promise<void>;
  converterLead: (id: string) => Promise<void>;
  marcarPerdido: (id: string, motivo?: string) => Promise<void>;
  retornarAoFunil: (id: string) => Promise<void>;
  adicionarBriefing: (
    leadId: string,
    briefing: Omit<Briefing, "id" | "leadId" | "data">
  ) => Promise<void>;
  completarMissao: (missaoId: string) => Promise<void>;
  transferLead: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const gerarMissoesDiarias = (): MissaoDiaria[] => [
  {
    id: "1",
    descricao: "Falar com 5 contatos",
    meta: 5,
    progresso: 0,
    concluida: false,
    pontos: 5,
  },
  {
    id: "2",
    descricao: "Esquentar 2 contatos",
    meta: 2,
    progresso: 0,
    concluida: false,
    pontos: 5,
  },
  {
    id: "3",
    descricao: "Resolver todos atrasados",
    meta: 1,
    progresso: 0,
    concluida: false,
    pontos: 10,
  },
];

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { refreshSession, isSessionInvalidError } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [gamificacao, setGamificacao] = useState<Gamificacao>({
    id: "",
    userId: "",
    pontosHoje: 0,
    pontosSemana: 0,
    pontosMes: 0,
    nivel: "Prospectador Iniciante",
    conquistas: [],
    missoesDiarias: gerarMissoesDiarias(),
    progressoDiario: 0,
  });
  const [metricasDiarias, setMetricasDiarias] = useState<MetricasDiarias>({
    id: "",
    userId: "",
    data: new Date(),
    contatosFeitos: 0,
    atrasosResolvidos: 0,
    novosLeads: 0,
    leadsQuentesTrabalhados: 0,
    taxaRitmo: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryAttemptsRef = useRef(0);
  const MAX_RETRY_ATTEMPTS = 1;

  const refreshData = useCallback(async (isRetry = false) => {
    try {
      setError(null);
      
      // Se for retry, tenta refresh da sessão primeiro
      if (isRetry && retryAttemptsRef.current < MAX_RETRY_ATTEMPTS) {
        retryAttemptsRef.current += 1;
        console.log(`Tentativa ${retryAttemptsRef.current} de refresh de sessão antes de recarregar dados`);
        try {
          await refreshSession(true);
          // Aguarda um pouco para garantir que cookies foram processados
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (refreshError) {
          console.warn("Erro ao fazer refresh de sessão:", refreshError);
        }
      } else {
        retryAttemptsRef.current = 0;
      }

      const [leadsData, gamificacaoData, metricasData] = await Promise.all([
        api.getLeads(),
        api.getGamificacao(),
        api.getMetricas(),
      ]);

      const leadsFormatados = leadsData.map((lead) => ({
        ...lead,
        ultimoContato: lead.ultimoContato ? new Date(lead.ultimoContato) : null,
        proximoContato: lead.proximoContato
          ? new Date(lead.proximoContato)
          : null,
        dataEntrada: new Date(lead.dataEntrada),
        dataConversao: lead.dataConversao ? new Date(lead.dataConversao) : null,
        historico: Array.isArray(lead.historico)
          ? lead.historico.map((item) => ({
              ...item,
              data: new Date(item.data),
            }))
          : [],
        briefings: Array.isArray(lead.briefings)
          ? lead.briefings.map((item) => ({
              ...item,
              data: new Date(item.data),
              proximoFollowUp: item.proximoFollowUp
                ? new Date(item.proximoFollowUp)
                : null,
            }))
          : [],
      }));

      setLeads(leadsFormatados);
      setGamificacao({
        ...gamificacaoData,
        ultimaAtividade: gamificacaoData.ultimaAtividade 
          ? new Date(gamificacaoData.ultimaAtividade) 
          : null,
        missoesDiarias: gamificacaoData.missoesDiarias || gerarMissoesDiarias(),
      });
      setMetricasDiarias(metricasData);
      retryAttemptsRef.current = 0; // Reset contador em caso de sucesso
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      
      // Verifica se é erro de sessão inválida
      if (isSessionInvalidError(err) && !isRetry && retryAttemptsRef.current < MAX_RETRY_ATTEMPTS) {
        // Tenta refresh e recarregar uma vez
        console.log("Sessão inválida detectada, tentando refresh e recarregar dados...");
        return refreshData(true);
      }
      
      // Determina mensagem de erro mais clara
      let errorMessage: string;
      if (isSessionInvalidError(err)) {
        errorMessage = "Sessão inválida. Por favor, faça login novamente.";
      } else if (err instanceof Error) {
        errorMessage = err.message || "Erro ao carregar dados";
      } else {
        errorMessage = "Erro ao carregar dados";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [refreshSession, isSessionInvalidError]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addLead = useCallback(
    async (
      leadData: Omit<
        Lead,
        | "id"
        | "proximoContato"
        | "status"
        | "prioridade"
        | "score"
        | "historico"
        | "pontos"
        | "nivel"
        | "conquistas"
      >
    ) => {
      try {
        setError(null);
        const novoLead = await api.createLead({
          ...leadData,
          ultimoContato: leadData.ultimoContato?.toISOString() || null,
          dataEntrada: leadData.dataEntrada?.toISOString() || new Date().toISOString(),
        });

        const leadFormatado = {
          ...novoLead,
          ultimoContato: novoLead.ultimoContato ? new Date(novoLead.ultimoContato) : null,
          proximoContato: novoLead.proximoContato ? new Date(novoLead.proximoContato) : null,
          dataEntrada: new Date(novoLead.dataEntrada),
          dataConversao: novoLead.dataConversao ? new Date(novoLead.dataConversao) : null,
          historico: Array.isArray(novoLead.historico)
            ? novoLead.historico.map((item) => ({
                ...item,
                data: new Date(item.data),
              }))
            : [],
          briefings: Array.isArray(novoLead.briefings)
            ? novoLead.briefings.map((item) => ({
                ...item,
                data: new Date(item.data),
                proximoFollowUp: item.proximoFollowUp ? new Date(item.proximoFollowUp) : null,
              }))
            : [],
        };

        setLeads((prev) => [...prev, leadFormatado]);
        await refreshData();
      } catch (err) {
        console.error("Erro ao adicionar lead:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar contato";
        setError(errorMessage);
        throw err;
      }
    },
    [refreshData]
  );

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    try {
      setError(null);
      const updateData: UpdateLeadInput = { ...updates };

      if (updates.ultimoContato) updateData.ultimoContato = updates.ultimoContato.toISOString();
      if (updates.proximoContato) updateData.proximoContato = updates.proximoContato.toISOString();
      if (updates.dataEntrada) updateData.dataEntrada = updates.dataEntrada.toISOString();
      if (updates.dataConversao) updateData.dataConversao = updates.dataConversao.toISOString();

      const leadAtualizado = await api.updateLead(id, updateData);

      const leadFormatado = {
        ...leadAtualizado,
        ultimoContato: leadAtualizado.ultimoContato ? new Date(leadAtualizado.ultimoContato) : null,
        proximoContato: leadAtualizado.proximoContato ? new Date(leadAtualizado.proximoContato) : null,
        dataEntrada: new Date(leadAtualizado.dataEntrada),
        dataConversao: leadAtualizado.dataConversao ? new Date(leadAtualizado.dataConversao) : null,
        historico: Array.isArray(leadAtualizado.historico)
          ? leadAtualizado.historico.map((item) => ({
              ...item,
              data: new Date(item.data),
            }))
          : [],
        briefings: Array.isArray(leadAtualizado.briefings)
          ? leadAtualizado.briefings.map((item) => ({
              ...item,
              data: new Date(item.data),
              proximoFollowUp: item.proximoFollowUp ? new Date(item.proximoFollowUp) : null,
            }))
          : [],
      };

      setLeads((prev) => prev.map((lead) => (lead.id === id ? leadFormatado : lead)));
    } catch (err) {
      console.error("Erro ao atualizar lead:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar contato";
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    try {
      setError(null);
      await api.deleteLead(id);
      setLeads((prev) => prev.filter((lead) => lead.id !== id));
    } catch (err) {
      console.error("Erro ao deletar lead:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao deletar contato";
      setError(errorMessage);
      throw err;
    }
  }, []);

  const registrarContato = useCallback(
    async (id: string, briefing?: Partial<Briefing>) => {
      try {
        setError(null);
        const lead = leads.find((item) => item.id === id);
        if (!lead) return;

        const leadAtualizado = await api.registrarContato(id, briefing);

        const leadFormatado = {
          ...leadAtualizado,
          ultimoContato: leadAtualizado.ultimoContato ? new Date(leadAtualizado.ultimoContato) : null,
          proximoContato: leadAtualizado.proximoContato ? new Date(leadAtualizado.proximoContato) : null,
          dataEntrada: new Date(leadAtualizado.dataEntrada),
          dataConversao: leadAtualizado.dataConversao ? new Date(leadAtualizado.dataConversao) : null,
          historico: Array.isArray(leadAtualizado.historico)
            ? leadAtualizado.historico.map((item) => ({
                ...item,
                data: new Date(item.data),
              }))
            : [],
          briefings: Array.isArray(leadAtualizado.briefings)
            ? leadAtualizado.briefings.map((item) => ({
                ...item,
                data: new Date(item.data),
                proximoFollowUp: item.proximoFollowUp ? new Date(item.proximoFollowUp) : null,
              }))
            : [],
        };

        setLeads((prev) => prev.map((item) => (item.id === id ? leadFormatado : item)));
        await refreshData();
      } catch (err) {
        console.error("Erro ao registrar contato:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro ao registrar contato";
        setError(errorMessage);
        throw err;
      }
    },
    [leads, refreshData]
  );

  const moverTemperatura = useCallback(
    async (id: string, novaTemperatura: Temperatura) => {
      try {
        setError(null);
        const lead = leads.find((item) => item.id === id);
        if (!lead) return;

        await updateLead(id, { temperatura: novaTemperatura });
        await refreshData();
      } catch (err) {
        console.error("Erro ao mover temperatura:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro ao mover temperatura";
        setError(errorMessage);
        throw err;
      }
    },
    [leads, updateLead, refreshData]
  );

  const converterLead = useCallback(
    async (id: string) => {
      try {
        setError(null);
        await updateLead(id, {
          status: "Convertido",
          dataConversao: new Date(),
        });
        await refreshData();
      } catch (err) {
        console.error("Erro ao converter lead:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro ao converter contato";
        setError(errorMessage);
        throw err;
      }
    },
    [updateLead, refreshData]
  );

  const marcarPerdido = useCallback(
    async (id: string, motivo?: string) => {
      try {
        setError(null);
        const leadAtualizado = await api.marcarLeadPerdido(id, motivo);

        const leadFormatado = {
          ...leadAtualizado,
          ultimoContato: leadAtualizado.ultimoContato ? new Date(leadAtualizado.ultimoContato) : null,
          proximoContato: leadAtualizado.proximoContato ? new Date(leadAtualizado.proximoContato) : null,
          dataEntrada: new Date(leadAtualizado.dataEntrada),
          dataConversao: leadAtualizado.dataConversao ? new Date(leadAtualizado.dataConversao) : null,
          historico: Array.isArray(leadAtualizado.historico)
            ? leadAtualizado.historico.map((item) => ({ ...item, data: new Date(item.data) }))
            : [],
          briefings: Array.isArray(leadAtualizado.briefings)
            ? leadAtualizado.briefings.map((item) => ({
                ...item,
                data: new Date(item.data),
                proximoFollowUp: item.proximoFollowUp ? new Date(item.proximoFollowUp) : null,
              }))
            : [],
        };

        setLeads((prev) => prev.map((lead) => (lead.id === id ? leadFormatado : lead)));
        await refreshData();
      } catch (err) {
        console.error("Erro ao marcar lead como perdido:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro ao marcar contato como perdido";
        setError(errorMessage);
        throw err;
      }
    },
    [refreshData]
  );

  const retornarAoFunil = useCallback(
    async (id: string) => {
      try {
        setError(null);
        await updateLead(id, {
          status: "Em Dia",
          temperatura: "Morno",
          dataConversao: null,
        });
      } catch (err) {
        console.error("Erro ao retornar ao funil:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro ao retornar ao funil";
        setError(errorMessage);
        throw err;
      }
    },
    [updateLead]
  );

  const adicionarBriefing = useCallback(
    async (leadId: string, briefingData: Omit<Briefing, "id" | "leadId" | "data">) => {
      try {
        setError(null);
        await api.createBriefing({
          ...briefingData,
          leadId,
          proximoFollowUp: briefingData.proximoFollowUp?.toISOString() || null,
        });

        await refreshData();
      } catch (err) {
        console.error("Erro ao adicionar briefing:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar briefing";
        setError(errorMessage);
        throw err;
      }
    },
    [refreshData]
  );

  const transferLead = useCallback(async (id: string) => {
    try {
      setError(null);
      const result = await api.transferLeadToCrm(id);
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === id
            ? {
                ...lead,
                crmContactId: result.contactId ?? null,
                crmDealId: result.dealId ?? null,
                crmDealUrl: result.dealUrl ?? null,
                transferredAt: result.transferredAt
                  ? new Date(result.transferredAt)
                  : new Date(),
              }
            : lead
        )
      );
    } catch (err) {
      console.error("Erro ao transferir lead para o CRM:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao transferir contato para o CRM";
      setError(errorMessage);
      throw err;
    }
  }, []);

  const completarMissao = useCallback(async (missaoId: string) => {
    try {
      setError(null);
      const updated = await api.completarMissao(missaoId);
      setGamificacao((prev) => ({
        ...prev,
        ...updated,
        missoesDiarias: updated.missoesDiarias || prev.missoesDiarias,
      }));
    } catch (err) {
      console.error("Erro ao completar missao:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao completar missao";
      setError(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    const meta = 10;
    const progresso = metricasDiarias.contatosFeitos + metricasDiarias.atrasosResolvidos;
    setGamificacao((prev) => ({
      ...prev,
      progressoDiario: Math.min((progresso / meta) * 100, 100),
    }));
  }, [metricasDiarias]);

  return (
    <CRMContext.Provider
      value={{
        leads,
        gamificacao,
        metricasDiarias,
        loading,
        error,
        addLead,
        updateLead,
        deleteLead,
        registrarContato,
        moverTemperatura,
        converterLead,
        marcarPerdido,
        retornarAoFunil,
        adicionarBriefing,
        completarMissao,
        transferLead,
        refreshData,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error("useCRM must be used within CRMProvider");
  }
  return context;
};
