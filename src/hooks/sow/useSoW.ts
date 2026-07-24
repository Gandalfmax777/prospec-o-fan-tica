import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { sowApi } from "@/services/sowApi";
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

const keys = {
  all: (org: string) => ["sow", org] as const,
  dashboard: (org: string, scope: string) => ["sow", org, "dashboard", scope] as const,
  indicadores: (org: string) => ["sow", org, "indicadores"] as const,
  clientes: (org: string, scope: string) => ["sow", org, "clientes", scope] as const,
  cliente: (org: string, id: string) => ["sow", org, "cliente", id] as const,
  catalogo: (org: string) => ["sow", org, "catalogo"] as const,
  instituicoes: (org: string, clienteId: string) => ["sow", org, "instituicoes", clienteId] as const,
  ativosCliente: (org: string, clienteId: string) => ["sow", org, "ativos", clienteId] as const,
  timeline: (org: string, clienteId: string) => ["sow", org, "timeline", clienteId] as const,
  oportunidades: (org: string) => ["sow", org, "oportunidades"] as const,
  alertas: (org: string) => ["sow", org, "alertas"] as const,
  historico: (org: string, clienteId?: string) => ["sow", org, "historico", clienteId ?? "carteira"] as const,
  score: (org: string) => ["sow", org, "score"] as const,
  importJob: (org: string, id: string) => ["sow", org, "importJob", id] as const,
};

// ── Dashboard / indicadores ──
export function useSoWDashboard(scope = "") {
  const org = useOrgId();
  return useQuery({ queryKey: keys.dashboard(org, scope), queryFn: () => sowApi.getDashboard({ scope: scope || undefined }) });
}
export function useSoWIndicadores() {
  const org = useOrgId();
  return useQuery({ queryKey: keys.indicadores(org), queryFn: () => sowApi.getIndicadores() });
}

// ── Clientes ──
export function useSoWClientes(params: { scope?: string; status?: string; sort?: string } = {}) {
  const org = useOrgId();
  return useQuery({
    queryKey: [...keys.clientes(org, params.scope ?? ""), params.status ?? "", params.sort ?? ""],
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

function useInvalidateClientes() {
  const qc = useQueryClient();
  const org = useOrgId();
  return () => qc.invalidateQueries({ queryKey: ["sow", org] });
}

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
  return useMutation({ mutationFn: (leadId: string) => sowApi.importFromLead(leadId), onSuccess: invalidate });
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
export function useSoWOportunidades(params: { status?: string; urgencia?: string; clienteId?: string } = {}) {
  const org = useOrgId();
  return useQuery({
    queryKey: [...keys.oportunidades(org), params.status ?? "", params.urgencia ?? "", params.clienteId ?? ""],
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
export function useSoWAlertas(params: { resolvido?: boolean; severidade?: string; clienteId?: string } = {}) {
  const org = useOrgId();
  return useQuery({
    queryKey: [...keys.alertas(org), String(params.resolvido ?? ""), params.severidade ?? "", params.clienteId ?? ""],
    queryFn: () => sowApi.getAlertas(params),
  });
}
export function useUpdateAlerta() {
  const qc = useQueryClient();
  const org = useOrgId();
  return useMutation({
    mutationFn: ({ id, resolvido }: { id: string; resolvido: boolean }) => sowApi.updateAlerta(id, { resolvido }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.alertas(org) }),
  });
}
export function useDeleteAlerta() {
  const qc = useQueryClient();
  const org = useOrgId();
  return useMutation({
    mutationFn: (id: string) => sowApi.deleteAlerta(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.alertas(org) }),
  });
}

// ── Histórico / score ──
export function useSoWHistorico(clienteId?: string, meses = 12) {
  const org = useOrgId();
  return useQuery({
    queryKey: [...keys.historico(org, clienteId), meses],
    queryFn: () => sowApi.getHistoricoShare({ clienteId, meses }),
  });
}
export function useSoWScore() {
  const org = useOrgId();
  return useQuery({ queryKey: keys.score(org), queryFn: () => sowApi.getScore() });
}

// ── IA ──
export function useImportarCarteira() {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: ({ clienteId, file }: { clienteId: string; file: File }) => sowApi.importarCarteira(clienteId, file),
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
export function useGerarBriefing() {
  return useMutation({ mutationFn: (clienteId: string) => sowApi.gerarBriefing(clienteId) });
}
