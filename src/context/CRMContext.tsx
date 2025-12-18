import { api } from "@/services/api";
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
  retornarAoFunil: (id: string) => Promise<void>;
  adicionarBriefing: (
    leadId: string,
    briefing: Omit<Briefing, "id" | "leadId" | "data">
  ) => Promise<void>;
  completarMissao: (missaoId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const gerarMissoesDiarias = (): MissaoDiaria[] => [
  {
    id: "1",
    descricao: "Falar com 5 leads",
    meta: 5,
    progresso: 0,
    concluida: false,
    pontos: 5,
  },
  {
    id: "2",
    descricao: "Esquentar 2 leads",
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

  const refreshData = useCallback(async () => {
    try {
      setError(null);
      const [leadsData, gamificacaoData, metricasData] = await Promise.all([
        api.getLeads(),
        api.getGamificacao(),
        api.getMetricas(),
      ]);

      // Converter datas de string para Date
      const leadsFormatados = leadsData.map((lead) => ({
        ...lead,
        ultimoContato: lead.ultimoContato ? new Date(lead.ultimoContato) : null,
        proximoContato: lead.proximoContato
          ? new Date(lead.proximoContato)
          : null,
        dataEntrada: new Date(lead.dataEntrada),
        dataConversao: lead.dataConversao ? new Date(lead.dataConversao) : null,
        historico:
          lead.historico?.map((h) => ({
            ...h,
            data: new Date(h.data),
          })) || [],
      }));

      setLeads(leadsFormatados);
      setGamificacao({
        ...gamificacaoData,
        missoesDiarias: gamificacaoData.missoesDiarias || gerarMissoesDiarias(),
      });
      setMetricasDiarias(metricasData);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar dados";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const adicionarPontos = useCallback(async (pontos: number) => {
    try {
      const updated = await api.adicionarPontos(pontos);
      setGamificacao((prev) => ({
        ...prev,
        ...updated,
        missoesDiarias: updated.missoesDiarias || prev.missoesDiarias,
      }));
    } catch (err) {
      console.error("Erro ao adicionar pontos:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar pontos";
      setError(errorMessage);
    }
  }, []);

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
          dataEntrada:
            leadData.dataEntrada?.toISOString() || new Date().toISOString(),
        });

        // Converter datas
        const leadFormatado = {
          ...novoLead,
          ultimoContato: novoLead.ultimoContato
            ? new Date(novoLead.ultimoContato)
            : null,
          proximoContato: novoLead.proximoContato
            ? new Date(novoLead.proximoContato)
            : null,
          dataEntrada: new Date(novoLead.dataEntrada),
          dataConversao: novoLead.dataConversao
            ? new Date(novoLead.dataConversao)
            : null,
          historico:
            novoLead.historico?.map((h) => ({
              ...h,
              data: new Date(h.data),
            })) || [],
        };

        setLeads((prev) => [...prev, leadFormatado]);
        await adicionarPontos(2);

        const metricas = await api.getMetricas();
        await api.updateMetricas({
          ...metricas,
          novosLeads: metricas.novosLeads + 1,
        });
        setMetricasDiarias((prev) => ({
          ...prev,
          novosLeads: prev.novosLeads + 1,
        }));
      } catch (err) {
        console.error("Erro ao adicionar lead:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar lead";
        setError(errorMessage);
        throw err;
      }
    },
    [adicionarPontos]
  );

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    try {
      setError(null);
      const updateData: UpdateLeadInput = { ...updates };

      // Converter datas para ISO string
      if (updates.ultimoContato)
        updateData.ultimoContato = updates.ultimoContato.toISOString();
      if (updates.proximoContato)
        updateData.proximoContato = updates.proximoContato.toISOString();
      if (updates.dataEntrada)
        updateData.dataEntrada = updates.dataEntrada.toISOString();
      if (updates.dataConversao)
        updateData.dataConversao = updates.dataConversao.toISOString();

      const leadAtualizado = await api.updateLead(id, updateData);

      // Converter datas
      const leadFormatado = {
        ...leadAtualizado,
        ultimoContato: leadAtualizado.ultimoContato
          ? new Date(leadAtualizado.ultimoContato)
          : null,
        proximoContato: leadAtualizado.proximoContato
          ? new Date(leadAtualizado.proximoContato)
          : null,
        dataEntrada: new Date(leadAtualizado.dataEntrada),
        dataConversao: leadAtualizado.dataConversao
          ? new Date(leadAtualizado.dataConversao)
          : null,
        historico:
          leadAtualizado.historico?.map((h) => ({
            ...h,
            data: new Date(h.data),
          })) || [],
      };

      setLeads((prev) =>
        prev.map((lead) => (lead.id === id ? leadFormatado : lead))
      );
    } catch (err) {
      console.error("Erro ao atualizar lead:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar lead";
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
      const errorMessage = err instanceof Error ? err.message : "Erro ao deletar lead";
      setError(errorMessage);
      throw err;
    }
  }, []);

  const registrarContato = useCallback(
    async (id: string, briefing?: Partial<Briefing>) => {
      try {
        setError(null);
        const lead = leads.find((l) => l.id === id);
        if (!lead) return;

        const wasAtrasado = lead.status === "Atrasado";
        const leadAtualizado = await api.registrarContato(id, briefing);

        // Converter datas
        const leadFormatado = {
          ...leadAtualizado,
          ultimoContato: leadAtualizado.ultimoContato
            ? new Date(leadAtualizado.ultimoContato)
            : null,
          proximoContato: leadAtualizado.proximoContato
            ? new Date(leadAtualizado.proximoContato)
            : null,
          dataEntrada: new Date(leadAtualizado.dataEntrada),
          dataConversao: leadAtualizado.dataConversao
            ? new Date(leadAtualizado.dataConversao)
            : null,
          historico:
            leadAtualizado.historico?.map((h) => ({
              ...h,
              data: new Date(h.data),
            })) || [],
        };

        setLeads((prev) => prev.map((l) => (l.id === id ? leadFormatado : l)));
        await adicionarPontos(3);

        const metricas = await api.getMetricas();
        await api.updateMetricas({
          ...metricas,
          contatosFeitos: metricas.contatosFeitos + 1,
          atrasosResolvidos: wasAtrasado
            ? metricas.atrasosResolvidos + 1
            : metricas.atrasosResolvidos,
        });
        setMetricasDiarias((prev) => ({
          ...prev,
          contatosFeitos: prev.contatosFeitos + 1,
          atrasosResolvidos: wasAtrasado
            ? prev.atrasosResolvidos + 1
            : prev.atrasosResolvidos,
        }));

        if (wasAtrasado) {
          await adicionarPontos(5);
        }
      } catch (err) {
        console.error("Erro ao registrar contato:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro ao registrar contato";
        setError(errorMessage);
        throw err;
      }
    },
    [leads, adicionarPontos]
  );

  const moverTemperatura = useCallback(
    async (id: string, novaTemperatura: Temperatura) => {
      try {
        setError(null);
        const lead = leads.find((l) => l.id === id);
        if (!lead) return;

        const pontosGanhos =
          novaTemperatura === "Quente"
            ? 5
            : novaTemperatura === "Morno"
            ? 3
            : 0;

        await updateLead(id, { temperatura: novaTemperatura });

        if (pontosGanhos > 0) {
          await adicionarPontos(pontosGanhos);
          if (novaTemperatura === "Quente") {
            const metricas = await api.getMetricas();
            await api.updateMetricas({
              ...metricas,
              leadsQuentesTrabalhados: metricas.leadsQuentesTrabalhados + 1,
            });
            setMetricasDiarias((prev) => ({
              ...prev,
              leadsQuentesTrabalhados: prev.leadsQuentesTrabalhados + 1,
            }));
          }
        }
      } catch (err) {
        console.error("Erro ao mover temperatura:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro ao mover temperatura";
        setError(errorMessage);
        throw err;
      }
    },
    [leads, updateLead, adicionarPontos]
  );

  const converterLead = useCallback(
    async (id: string) => {
      try {
        setError(null);
        await updateLead(id, {
          status: "Convertido",
          dataConversao: new Date(),
        });
        await adicionarPontos(10);
      } catch (err) {
        console.error("Erro ao converter lead:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro ao converter lead";
        setError(errorMessage);
        throw err;
      }
    },
    [updateLead, adicionarPontos]
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
    async (
      leadId: string,
      briefingData: Omit<Briefing, "id" | "leadId" | "data">
    ) => {
      try {
        setError(null);
        await api.createBriefing({
          ...briefingData,
          leadId,
          proximoFollowUp: briefingData.proximoFollowUp?.toISOString() || null,
        });

        // Atualizar lead localmente
        await refreshData();
        await adicionarPontos(2);
      } catch (err) {
        console.error("Erro ao adicionar briefing:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar briefing";
        setError(errorMessage);
        throw err;
      }
    },
    [refreshData, adicionarPontos]
  );

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
      console.error("Erro ao completar missão:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao completar missão";
      setError(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    const meta = 10;
    const progresso =
      metricasDiarias.contatosFeitos + metricasDiarias.atrasosResolvidos;
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
        retornarAoFunil,
        adicionarBriefing,
        completarMissao,
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
