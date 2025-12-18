import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth } from "@/services/auth";
import type { User, Session, LoginInput, RegisterInput } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const sessionData = await auth.getSession();
      if (sessionData) {
        setUser(sessionData.user);
        setSession(sessionData.session);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error("Erro ao atualizar sessão:", error);
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const signIn = useCallback(async (input: LoginInput) => {
    const result = await auth.signIn(input);
    // Define o usuário e sessão imediatamente com os dados do login
    setUser(result.user);
    setSession(result.session);
    // Aguarda um pouco para garantir que os cookies foram processados
    // antes de tentar atualizar a sessão do servidor
    setTimeout(async () => {
      try {
        const sessionData = await auth.getSession();
        if (sessionData) {
          setUser(sessionData.user);
          setSession(sessionData.session);
        }
      } catch (error) {
        console.warn("Não foi possível atualizar a sessão após login:", error);
        // Mantém os dados do login mesmo se não conseguir atualizar
      }
    }, 500);
  }, []);

  const signUp = useCallback(async (input: RegisterInput) => {
    const result = await auth.signUp(input);
    // Define o usuário e sessão imediatamente com os dados do registro
    setUser(result.user);
    setSession(result.session);
    // Aguarda um pouco para garantir que os cookies foram processados
    // antes de tentar atualizar a sessão do servidor
    setTimeout(async () => {
      try {
        const sessionData = await auth.getSession();
        if (sessionData) {
          setUser(sessionData.user);
          setSession(sessionData.session);
        }
      } catch (error) {
        console.warn("Não foi possível atualizar a sessão após registro:", error);
        // Mantém os dados do registro mesmo se não conseguir atualizar
      }
    }, 500);
  }, []);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        refreshSession,
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

