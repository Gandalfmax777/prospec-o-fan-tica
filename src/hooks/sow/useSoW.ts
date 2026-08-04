import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { sowApi, type SoWScopeParams } from "@/services/sowApi";
import type {
  CreateClienteInput,
  UpdateClienteInput,
  CreateInstituicaoInput,
  CreateAtivoInput,
} from "@/types/sow";

// organizationId entra em TODA query key → isolamento por org no cache.
function useOrgId() {
  return useAuth().user?.organizationId ?? "no-org";
}

type ScopeArgs = SoWScopeParams;

/**
 * Escopo corrente, serializado para entrar na query key.
 *
 * TODA chave de listagem/agregação precisa dele. Sem isso o react-query devolve
 * o cache do escopo anterior ao trocar de "meus clientes" para "toda a
 * organização" — a tela não muda, e o bug de carteiras misturadas volta
 * mascarado de "não atualiza".
 */
const scopeKey = (s: ScopeArgs) => `${s.scope ?? ""}:${s.assessorId ?? ""}`;

const keys = {
  all: (org: string) => ["sow", org] as const,
  dashboard: (org: string, scope: string) => ["sow", org, "dashboard", scope] as const,
  indicadores: (org: string, scope: string) => ["sow", org, "indicadores", scope] as const,
  clientes: (org: string, scope: string) => ["sow", org, "clientes", scope] as const,
  cliente: (org: string, id: string) => ["sow", org, "cliente", id] as const,
  catalogo: (org: string) => ["sow", org, "catalogo"] as const,
  instituicoes: (org: string, clienteId: string) => ["sow", org, "instituicoes", clienteId] as const,
  ativosCliente: (org: string, clienteId: string) => ["sow", org, "ativos", clienteId] as const,
  timeline: (org: string, clienteId: string) => ["sow", org, "timeline", clienteId] as const,
  oportunidades: (org: string, scope: string) => ["sow", org, "oportunidades", scope] as const,
  alertas: (org: string, scope: string) => ["sow", org, "alertas", scope] as const,
  historico: (org: string, scope: string, clienteId?: string) =>
    ["sow", org, "historico", scope, clienteId ?? "carteira"] as const,
  score: (org: string, scope: string) => ["sow", org, "score", scope] as const,
  equipe: (org: string) => ["sow", org, "equipe"] as const,
  importJob: (org: string, id: string) => ["sow", org, "importJob", id] as const,
  analise: (org: string, clienteId: string) => ["sow", org, "analise", clienteId] as const,
};

// ── Dashboard / indicadores ──
export function useSoWDashboard(params: ScopeArgs = {}) {
  const org = useOrgId();
  return useQuery({
    queryKey: keys.dashboard(org, scopeKey(params)),
    queryFn: () => sowApi.getDashboard(params),
  });
}
export function useSoWIndicadores(params: ScopeArgs = {}) {
  const org = useOrgId();
  return useQuery({
    queryKey: keys.indicadores(org, scopeKey(params)),
    queryFn: () => sowApi.getIndicadores(params),
  });
}

// ── Clientes ──
export function useSoWClientes(params: ScopeArgs & { status?: string; sort?: string } = {}) {
  const org = useOrgId();
  return useQuery({
    queryKey: [...keys.clientes(org, scopeKey(params)), params.status ?? "", params.sort ?? ""],
    queryFn: () => sowApi.getClientes(params),
  });
}
export function useSoWCliente(id: string | null) {
  const org = useOrgId();
  return useQuery({
    queryKey: keys.cliente(org, id ?? ""),
    queryFn: () => sowApi.getCliente(id as string),
    enabled: !!id,
  });
}

/**
 * Invalida TODO o cache do SoW da org. Exportado porque a importação de
 * carteira conclui em background (job assíncrono, fora de uma mutation), então
 * o componente precisa disparar a recarga por conta própria — sem isso a
 * carteira e o dashboard seguem mostrando os números de antes da importação.
 */
export function useInvalidateSoW() {
  const qc = useQueryClient();
  const org = useOrgId();
  return () => qc.invalidateQueries({ queryKey: ["sow", org] });
}

const useInvalidateClientes = useInvalidateSoW;

export function useCreateCliente() {
  const invalidate = useInvalidateClientes();
  return useMutation({ mutationFn: (b: CreateClienteInput) => sowApi.createCliente(b), onSuccess: invalidate });
}
export function useUpdateCliente() {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateClienteInput }) => sowApi.updateCliente(id, body),
    onSuccess: invalidate,
  });
}
export function useDeleteCliente() {
  const invalidate = useInvalidateClientes();
  return useMutation({ mutationFn: (id: string) => sowApi.deleteCliente(id), onSuccess: invalidate });
}
export function useImportFromLead() {
  const invalidate = useInvalidateClientes();
  return useMutation({ mutationFn: ({ leadId, metaSharePct }: { leadId: string; metaSharePct: number }) =>
      sowApi.importFromLead(leadId, metaSharePct),
    onSuccess: invalidate, });
}

// ── Catálogo ──
export function useSoWCatalogo() {
  const org = useOrgId();
  return useQuery({ queryKey: keys.catalogo(org), queryFn: () => sowApi.getCatalogo() });
}
// Marcar `interna` propaga para as instituições dos clientes e recalcula
// patrimônio no backend → invalida tudo, não só o catálogo.
export function useUpdateCatalogo() {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<{ nome: string; interna: boolean; ativo: boolean; ordem: number }> }) =>
      sowApi.updateCatalogo(id, body),
    onSuccess: invalidate,
  });
}
export function useCreateCatalogo() {
  const qc = useQueryClient();
  const org = useOrgId();
  return useMutation({
    mutationFn: (b: { nome: string; interna?: boolean }) => sowApi.createCatalogo(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.catalogo(org) }),
  });
}
// Remover do catálogo zera o `catalogoId` das instituições vinculadas (SET NULL),
// então a lista de instituições dos clientes também sai do cache.
export function useDeleteCatalogo() {
  const invalidate = useInvalidateClientes();
  return useMutation({ mutationFn: (id: string) => sowApi.deleteCatalogo(id), onSuccess: invalidate });
}

// ── Instituições ──
export function useSoWInstituicoes(clienteId: string | null) {
  const org = useOrgId();
  return useQuery({
    queryKey: keys.instituicoes(org, clienteId ?? ""),
    queryFn: () => sowApi.getInstituicoes(clienteId as string),
    enabled: !!clienteId,
  });
}
export function useCreateInstituicao(clienteId: string) {
  const invalidate = useInvalidateClientes();
  return useMutation({ mutationFn: (b: CreateInstituicaoInput) => sowApi.createInstituicao(clienteId, b), onSuccess: invalidate });
}
export function useUpdateInstituicao() {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CreateInstituicaoInput> }) => sowApi.updateInstituicao(id, body),
    onSuccess: invalidate,
  });
}
export function useDeleteInstituicao() {
  const invalidate = useInvalidateClientes();
  return useMutation({ mutationFn: (id: string) => sowApi.deleteInstituicao(id), onSuccess: invalidate });
}

/**
 * "Patrimônio na EQI" não é um campo — é a soma dos ativos sob instituições com
 * `interna=true`. Este hook resolve (e cria, se preciso) essa instituição para um
 * cliente, para que a UI ofereça um caminho direto em vez de exigir que o usuário
 * deduza o modelo de dados.
 */
export function useInstituicaoInterna(clienteId: string | null) {
  const { data: instituicoes, isLoading } = useSoWInstituicoes(clienteId);
  const { data: catalogo } = useSoWCatalogo();
  const createInstituicao = useCreateInstituicao(clienteId ?? "");

  const instituicaoInterna = (instituicoes ?? []).find((i) => i.interna) ?? null;
  const entradaCatalogo = (catalogo ?? []).find((c) => c.interna && c.ativo) ?? null;
  const nome = instituicaoInterna?.nome ?? entradaCatalogo?.nome ?? "EQI";

  // Devolve o id da instituição interna do cliente, criando-a se ainda não existir.
  const garantir = async (): Promise<string> => {
    if (instituicaoInterna) return instituicaoInterna.id;
    // Com catalogoId o backend denormaliza `interna` do catálogo sozinho; sem ele
    // (org antiga, sem entrada interna no catálogo) mandamos `interna` explícito.
    const criada = await createInstituicao.mutateAsync(
      entradaCatalogo
        ? { nome: entradaCatalogo.nome, catalogoId: entradaCatalogo.id }
        : { nome: "EQI", interna: true }
    );
    return criada.id;
  };

  return {
    instituicaoInterna,
    nome,
    garantir,
    isLoading,
    isPending: createInstituicao.isPending,
  };
}

// ── Ativos ──
export function useSoWAtivosCliente(clienteId: string | null) {
  const org = useOrgId();
  return useQuery({
    queryKey: keys.ativosCliente(org, clienteId ?? ""),
    queryFn: () => sowApi.getAtivosCliente(clienteId as string),
    enabled: !!clienteId,
  });
}
export function useCreateAtivo() {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: ({ instituicaoId, body }: { instituicaoId: string; body: CreateAtivoInput }) => sowApi.createAtivo(instituicaoId, body),
    onSuccess: invalidate,
  });
}
export function useUpdateAtivo() {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CreateAtivoInput> & { instituicaoId?: string } }) => sowApi.updateAtivo(id, body),
    onSuccess: invalidate,
  });
}
export function useDeleteAtivo() {
  const invalidate = useInvalidateClientes();
  return useMutation({ mutationFn: (id: string) => sowApi.deleteAtivo(id), onSuccess: invalidate });
}

// ── Timeline ──
export function useSoWTimeline(clienteId: string | null) {
  const org = useOrgId();
  return useQuery({
    queryKey: keys.timeline(org, clienteId ?? ""),
    queryFn: () => sowApi.getTimeline(clienteId as string),
    enabled: !!clienteId,
  });
}
export function useCreateEvento(clienteId: string) {
  const qc = useQueryClient();
  const org = useOrgId();
  return useMutation({
    mutationFn: (b: { data: string; tipo: string; descricao: string; valor?: number | null }) => sowApi.createEvento(clienteId, b),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.timeline(org, clienteId) }),
  });
}
// Só eventos persistidos (origem "evento"). Vencimentos são derivados de Ativo e
// não têm linha própria — quem exclui um vencimento é a exclusão do ativo.
export function useDeleteEvento(clienteId: string) {
  const qc = useQueryClient();
  const org = useOrgId();
  return useMutation({
    mutationFn: (id: string) => sowApi.deleteEvento(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.timeline(org, clienteId) }),
  });
}

// ── Oportunidades ──
export function useSoWOportunidades(
  params: ScopeArgs & { status?: string; urgencia?: string; clienteId?: string } = {}
) {
  const org = useOrgId();
  return useQuery({
    queryKey: [
      ...keys.oportunidades(org, scopeKey(params)),
      params.status ?? "",
      params.urgencia ?? "",
      params.clienteId ?? "",
    ],
    queryFn: () => sowApi.getOportunidades(params),
  });
}
// Valor e status alimentam "Em Negociação" e "Valor Convertido" no dashboard,
// então invalidamos tudo — não só a lista de oportunidades.
export function useUpdateOportunidade() {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => sowApi.updateOportunidade(id, body),
    onSuccess: invalidate,
  });
}
export function useDeleteOportunidade() {
  const invalidate = useInvalidateClientes();
  return useMutation({ mutationFn: (id: string) => sowApi.deleteOportunidade(id), onSuccess: invalidate });
}

// ── Alertas ──
export function useSoWAlertas(
  params: ScopeArgs & { resolvido?: boolean; severidade?: string; clienteId?: string } = {}
) {
  const org = useOrgId();
  return useQuery({
    queryKey: [
      ...keys.alertas(org, scopeKey(params)),
      String(params.resolvido ?? ""),
      params.severidade ?? "",
      params.clienteId ?? "",
    ],
    queryFn: () => sowApi.getAlertas(params),
  });
}
// Prefixo sem o escopo de propósito: resolver um alerta tem que invalidar a
// lista de TODOS os escopos em cache, não só a que está na tela.
export function useUpdateAlerta() {
  const qc = useQueryClient();
  const org = useOrgId();
  return useMutation({
    mutationFn: ({ id, resolvido }: { id: string; resolvido: boolean }) => sowApi.updateAlerta(id, { resolvido }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sow", org, "alertas"] }),
  });
}
export function useDeleteAlerta() {
  const qc = useQueryClient();
  const org = useOrgId();
  return useMutation({
    mutationFn: (id: string) => sowApi.deleteAlerta(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sow", org, "alertas"] }),
  });
}

// ── Histórico / score ──
export function useSoWHistorico(
  params: ScopeArgs & { clienteId?: string; meses?: number } = {}
) {
  const org = useOrgId();
  const { clienteId, meses = 12 } = params;
  return useQuery({
    queryKey: [...keys.historico(org, scopeKey(params), clienteId), meses],
    queryFn: () => sowApi.getHistoricoShare({ ...params, meses }),
  });
}
export function useSoWScore(params: ScopeArgs = {}) {
  const org = useOrgId();
  return useQuery({
    queryKey: keys.score(org, scopeKey(params)),
    queryFn: () => sowApi.getScore(params),
  });
}

// ── Liderança ──
export function useSoWEquipe(enabled = true) {
  const org = useOrgId();
  return useQuery({ queryKey: keys.equipe(org), queryFn: () => sowApi.getEquipe(), enabled });
}

// ── IA ──
export function useImportarCarteira() {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: ({ clienteId, files }: { clienteId: string; files: File[] }) => sowApi.importarCarteira(clienteId, files),
    onSuccess: invalidate,
  });
}
export function useImportJob(id: string | null, poll = false) {
  const org = useOrgId();
  return useQuery({
    queryKey: keys.importJob(org, id ?? ""),
    queryFn: () => sowApi.getImportJob(id as string),
    enabled: !!id,
    refetchInterval: poll ? 2500 : false,
    // A importação roda no servidor e conclui sozinha. Por padrão o React Query
    // pausa o refetchInterval em aba oculta, então trocar de aba durante o
    // processamento congelava a tela no "A IA está lendo os extratos…" até
    // voltar o foco. É o único polling do módulo que precisa disso — os demais
    // só refletem ação do usuário, que por definição está com a aba à frente.
    refetchIntervalInBackground: poll,
  });
}
export function useGerarAlertas() {
  const invalidate = useInvalidateClientes();
  return useMutation({ mutationFn: (clienteId: string) => sowApi.gerarAlertas(clienteId), onSuccess: invalidate });
}
export function useGerarOportunidades() {
  const invalidate = useInvalidateClientes();
  return useMutation({ mutationFn: (clienteId: string) => sowApi.gerarOportunidades(clienteId), onSuccess: invalidate });
}
export function useGerarScore() {
  const invalidate = useInvalidateClientes();
  return useMutation({ mutationFn: (clienteId: string) => sowApi.gerarScore(clienteId), onSuccess: invalidate });
}
export function useGerarFollowUp() {
  return useMutation({
    mutationFn: ({ clienteId, oportunidadeId, canal, tom }: { clienteId: string; oportunidadeId?: string; canal?: string; tom?: string }) =>
      sowApi.gerarFollowUp(clienteId, { oportunidadeId, canal, tom }),
  });
}
/**
 * Última análise de carteira salva do cliente.
 *
 * Substitui os dois `useState` que existiam em ClienteDetail e IAView: o estado
 * era volátil, então cada releitura custava uma geração de Opus (~60s), e em
 * IAView ele nem era limpo ao trocar de cliente — o relatório de um aparecia sob
 * o nome do outro. Com a query keyed por clienteId, o vazamento some por
 * construção.
 *
 * staleTime alto de propósito: a análise só muda quando alguém gera outra (a
 * mutation abaixo escreve no cache) ou quando o patrimônio muda — e QUALQUER
 * mutação de patrimônio já invalida ["sow", org] inteiro via useInvalidateSoW,
 * o que refaz esta query e traz o `desatualizada` novo do backend. A flag
 * aparece sozinha, sem plumbing nenhum.
 */
export function useAnaliseCarteira(clienteId: string | null) {
  const org = useOrgId();
  return useQuery({
    queryKey: keys.analise(org, clienteId ?? ""),
    queryFn: () => sowApi.getAnaliseCarteira(clienteId as string),
    enabled: !!clienteId,
    staleTime: 5 * 60 * 1000,
  });
}

// Invalida, ao contrário do antigo useGerarBriefing: a análise não só devolve
// texto, ela grava o comentário individual em cada ativo comentado.
export function useAnalisarCarteira() {
  const qc = useQueryClient();
  const org = useOrgId();
  return useMutation({
    mutationFn: (clienteId: string) => sowApi.analisarCarteira(clienteId),
    onSuccess: (analise, clienteId) => {
      // A análise recém-gerada JÁ veio na resposta do POST (mesmo shape do GET):
      // escrever no cache evita um GET redundante logo depois de uma chamada que
      // levou ~60s e custou caro.
      qc.setQueryData(keys.analise(org, clienteId), analise);
      // O predicate poupa a própria chave que acabamos de preencher; sem ele o
      // invalidate marcaria como stale o dado que a linha acima escreveu e
      // dispararia um refetch imediato dele.
      qc.invalidateQueries({
        queryKey: keys.all(org),
        predicate: (q) => q.queryKey[2] !== "analise",
      });
    },
  });
}
