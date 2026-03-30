import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { auth, isNetworkError } from "@/services/auth";
import { api } from "@/services/api";
import type { User, Session, LoginInput, RegisterInput, OrgMembership } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  organizations: OrgMembership[];
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: (retryOnError?: boolean) => Promise<void>;
  isSessionInvalidError: (error: unknown) => boolean;
  switchOrganization: (orgId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mergeRoleData = (
  base: User,
  me?: {
    role?: string;
    managerId?: string | null;
    organizationId?: string | null;
    organization?: { id: string; name: string; slug: string } | null;
    organizations?: OrgMembership[];
  }
) => ({
  ...base,
  role: me?.role ?? base.role ?? "SELLER",
  managerId: me?.managerId ?? base.managerId ?? null,
  organizationId: me?.organizationId ?? base.organizationId ?? null,
  organization: me?.organization ?? base.organization ?? null,
  organizations: me?.organizations ?? base.organizations ?? [],
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<OrgMembership[]>([]);
  const refreshAttemptsRef = useRef(0);
  const MAX_REFRESH_ATTEMPTS = 2;

  // Helper para verificar se erro é de sessão inválida
  const isSessionInvalidError = (error: unknown): boolean => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes("sessão inválida") ||
        message.includes("sessao invalida") ||
        message.includes("não autenticado") ||
        message.includes("nao autenticado") ||
        message.includes("not authenticated") ||
        message.includes("unauthorized") ||
        message.includes("401")
      );
    }
    return false;
  };

  const refreshSession = useCallback(async (retryOnError = false, silent = false): Promise<void> => {
    if (!silent) setLoading(true);
    try {
      refreshAttemptsRef.current = 0;
      const sessionData = await auth.getSession();
      if (sessionData) {
        try {
          const me = await api.getMe();
          setUser(mergeRoleData(sessionData.user, me));
          setOrganizations(me.organizations ?? []);
          setSession(sessionData.session);
        } catch (error) {
          // Se erro ao obter /me e for erro de autenticação, tenta refresh
          if (retryOnError && isSessionInvalidError(error) && refreshAttemptsRef.current < MAX_REFRESH_ATTEMPTS) {
            refreshAttemptsRef.current += 1;
            console.warn(`Tentativa ${refreshAttemptsRef.current} de refresh de sessão após erro em /me`);
            await new Promise((resolve) => setTimeout(resolve, 500));
            return refreshSession(false, silent);
          }
          console.warn("Nao foi possivel obter /me:", error);
          setUser(mergeRoleData(sessionData.user));
          setSession(sessionData.session);
        }
      } else {
        // getSession() retornou null → servidor respondeu que NÃO há sessão válida
        // (erros de rede são propagados como exceção e caem no catch abaixo)
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error("Erro ao atualizar sessao:", error);

      // Se for erro de sessão inválida e ainda não excedeu tentativas, tenta refresh
      if (retryOnError && isSessionInvalidError(error) && refreshAttemptsRef.current < MAX_REFRESH_ATTEMPTS) {
        refreshAttemptsRef.current += 1;
        console.warn(`Tentativa ${refreshAttemptsRef.current} de refresh de sessão`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return refreshSession(false, silent);
      }

      // Erro de rede/timeout (conexão instável, restart da VPS, etc.)
      // → NUNCA desloga o usuário, independente de ser silent ou não.
      // O usuário pode ter sessão válida mas o servidor está temporariamente inacessível.
      if (isNetworkError(error)) {
        console.warn("Servidor inacessível — mantendo sessão atual do usuário");
        // Se é o mount inicial (silent=false) e não tem user ainda, marca loading como false
        // mas NÃO seta user como null — vai tentar de novo no visibilitychange ou interval
        return;
      }

      // Erro explícito de auth (sessão expirada, cookie inválido) → desloga
      // Em refresh silencioso (background), só derruba a sessão se for erro explícito de auth.
      if (!silent || isSessionInvalidError(error)) {
        setUser(null);
        setSession(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Carrega sessão no mount inicial
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Renova sessão silenciosamente a cada 10 minutos enquanto logado
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshSession(false, true);
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, refreshSession]);

  // Revalida sessão quando o usuário retorna à aba após inatividade
  // retryOnError=true para aguentar falhas temporárias de rede
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== "visible" || !user) return;

      // Tenta revalidar a sessão. Se falhar por rede (instabilidade, restart da VPS),
      // faz um retry adicional após 3s.
      try {
        await refreshSession(true, true);
      } catch {
        // refreshSession já trata erros internamente, mas por segurança:
        // se houve falha temporária, tenta mais uma vez após 3s
        if (document.visibilityState !== "visible") return;
        await new Promise((resolve) => setTimeout(resolve, 3000));
        try {
          await refreshSession(true, true);
        } catch {
          // mantém sessão atual — não desloga
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [user, refreshSession]);

  const signIn = useCallback(async (input: LoginInput) => {
    // Não seta o user do Better Auth diretamente pois ele não contém organizationId.
    // Mantém loading=true (via refreshSession) para o AuthGuard não redirecionar antes
    // de termos os dados completos do /me.
    await auth.signIn(input);
    // Pequena pausa para garantir que os cookies foram processados pelo browser
    await new Promise((resolve) => setTimeout(resolve, 300));
    await refreshSession();
  }, [refreshSession]);

  const signUp = useCallback(async (input: RegisterInput) => {
    await auth.signUp(input);
    await new Promise((resolve) => setTimeout(resolve, 300));
    await refreshSession();
  }, [refreshSession]);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setUser(null);
    setSession(null);
    setOrganizations([]);
  }, []);

  const switchOrganization = useCallback(async (orgId: string) => {
    await api.switchOrganization(orgId);
    await refreshSession(false, true);
  }, [refreshSession]);

  // Expor função helper para outros componentes verificarem erros de sessão
  const isSessionInvalidErrorPublic = useCallback((error: unknown): boolean => {
    return isSessionInvalidError(error);
  }, []);

  // Wrapper para refreshSession que sempre tenta retry
  const refreshSessionPublic = useCallback(async (retryOnError = true): Promise<void> => {
    return refreshSession(retryOnError);
  }, [refreshSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        organizations,
        signIn,
        signUp,
        signOut,
        refreshSession: refreshSessionPublic,
        isSessionInvalidError: isSessionInvalidErrorPublic,
        switchOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
