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
    setUser(result.user);
    setSession(result.session);
    // Atualiza a sessão para garantir que está sincronizada com o servidor
    await refreshSession();
  }, [refreshSession]);

  const signUp = useCallback(async (input: RegisterInput) => {
    const result = await auth.signUp(input);
    setUser(result.user);
    setSession(result.session);
    // Atualiza a sessão para garantir que está sincronizada com o servidor
    await refreshSession();
  }, [refreshSession]);

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

