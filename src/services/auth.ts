import type { LoginInput, RegisterInput, Session, User } from "@/types/auth";

const AUTH_URL =
  import.meta.env.VITE_BETTER_AUTH_URL || "http://localhost:3333/api/auth";

/**
 * Faz uma requisição para a API de autenticação
 */
async function authRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${AUTH_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
    ...options,
  };

  if (
    config.body &&
    typeof config.body === "object" &&
    !(config.body instanceof FormData)
  ) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const responseData = await response.json();

    if (!response.ok) {
      const error =
        responseData.error ||
        responseData.message ||
        `HTTP error! status: ${response.status}`;
      throw new Error(
        typeof error === "string" ? error : error.message || "Erro desconhecido"
      );
    }

    return responseData;
  } catch (error) {
    console.error("Auth Error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro desconhecido na autenticação");
  }
}

export const auth = {
  /**
   * Fazer login com email e senha
   */
  async signIn(input: LoginInput): Promise<{ user: User; session: Session }> {
    const body = {
      email: input.email,
      password: input.password,
    };
    const response = await authRequest<{
      data?: {
        user: Omit<User, "createdAt" | "updatedAt"> & {
          createdAt: string;
          updatedAt: string;
        };
        session?: Omit<Session, "expiresAt" | "user"> & {
          expiresAt: string;
        };
        token?: string;
      };
      user?: Omit<User, "createdAt" | "updatedAt"> & {
        createdAt: string;
        updatedAt: string;
      };
      token?: string;
      session?: Omit<Session, "expiresAt" | "user"> & {
        expiresAt: string;
      };
      error?: { message: string };
    }>("/sign-in/email", {
      method: "POST",
      body: body as unknown as BodyInit,
    });

    if (response.error) {
      throw new Error(response.error?.message || "Erro ao fazer login");
    }

    // Better Auth pode retornar em diferentes formatos
    const userRaw = response.data?.user || response.user;
    const token = response.data?.token || response.token;
    const sessionFromResponse = response.data?.session || response.session;

    if (!userRaw) {
      console.error("Resposta completa do sign-in:", response);
      throw new Error("Resposta inválida do servidor: usuário não encontrado");
    }

    // Converte as datas de string para Date
    const user: User = {
      ...userRaw,
      createdAt:
        userRaw.createdAt instanceof Date
          ? userRaw.createdAt
          : new Date(userRaw.createdAt),
      updatedAt:
        userRaw.updatedAt instanceof Date
          ? userRaw.updatedAt
          : new Date(userRaw.updatedAt),
    };

    // Se já tiver session na resposta, usa ela (convertendo datas se necessário)
    if (sessionFromResponse) {
      const session: Session = {
        ...sessionFromResponse,
        expiresAt:
          sessionFromResponse.expiresAt instanceof Date
            ? sessionFromResponse.expiresAt
            : new Date(sessionFromResponse.expiresAt),
        user: user,
      };
      return {
        user,
        session,
      };
    }

    // Se não, constrói a partir do token
    if (token) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias
      const session: Session = {
        id: token,
        userId: user.id,
        expiresAt: expiresAt,
        token: token,
        ipAddress: null,
        userAgent: null,
        user: user,
      };
      return {
        user,
        session,
      };
    }

    // Se não tiver token nem session, tenta obter a sessão do servidor
    // Isso é importante em produção onde os cookies podem demorar um pouco para serem definidos
    try {
      // Aguarda um pouco para garantir que os cookies foram processados
      await new Promise((resolve) => setTimeout(resolve, 200));
      const sessionData = await this.getSession();
      if (sessionData) {
        return {
          user,
          session: sessionData.session,
        };
      }
    } catch (e) {
      console.warn("Não foi possível obter a sessão após login:", e);
    }

    throw new Error("Resposta inválida do servidor: sessão não encontrada");
  },

  /**
   * Registrar novo usuário
   */
  async signUp(
    input: RegisterInput
  ): Promise<{ user: User; session: Session }> {
    const body = {
      email: input.email,
      password: input.password,
      name: input.name,
    };
    const response = await authRequest<{
      data?: {
        user: User;
        token?: string;
        session?: Session;
      };
      user?: User;
      token?: string;
      session?: Session;
      error?: { message: string };
    }>("/sign-up/email", {
      method: "POST",
      body: body as unknown as BodyInit,
    });

    if (response.error) {
      throw new Error(response.error?.message || "Erro ao registrar");
    }

    // Better Auth retorna { token, user } no sign-up
    // Precisamos construir o objeto session a partir do token
    const userRaw = response.data?.user || response.user;
    const token = response.data?.token || response.token;

    if (!userRaw) {
      console.error("Resposta completa:", response);
      throw new Error("Resposta inválida do servidor: usuário não encontrado");
    }

    // Converte as datas de string para Date
    const user: User = {
      ...userRaw,
      createdAt:
        userRaw.createdAt instanceof Date
          ? userRaw.createdAt
          : new Date(userRaw.createdAt),
      updatedAt:
        userRaw.updatedAt instanceof Date
          ? userRaw.updatedAt
          : new Date(userRaw.updatedAt),
    };

    // Se não houver token, tenta obter a sessão
    if (!token) {
      // Tenta obter a sessão atual
      try {
        const sessionData = await this.getSession();
        if (sessionData) {
          return {
            user,
            session: sessionData.session,
          };
        }
      } catch (e) {
        console.warn("Não foi possível obter a sessão:", e);
      }
    }

    // Constrói um objeto session básico a partir do token
    // O Better Auth usa o token para identificar a sessão
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias
    const session: Session = {
      id: token || "",
      userId: user.id,
      expiresAt: expiresAt,
      token: token || "",
      ipAddress: null,
      userAgent: null,
      user: user,
    };

    return {
      user,
      session,
    };
  },

  /**
   * Fazer logout
   */
  async signOut(): Promise<void> {
    await authRequest("/sign-out", {
      method: "POST",
    });
  },

  /**
   * Obter sessão atual
   */
  async getSession(): Promise<{ user: User; session: Session } | null> {
    try {
      const response = await authRequest<{
        data?: {
          user: User;
          session: Session;
        };
        user?: User;
        session?: Session;
      }>("/get-session", {
        method: "GET",
      });

      // Better Auth pode retornar data.user/session ou diretamente user/session
      const user = response.data?.user || response.user;
      const session = response.data?.session || response.session;

      if (!user || !session) {
        return null;
      }

      return {
        user,
        session,
      };
    } catch (error) {
      // Se não houver sessão, retorna null
      return null;
    }
  },

  /**
   * Obter usuário atual
   */
  async getUser(): Promise<User | null> {
    const session = await this.getSession();
    return session?.user || null;
  },
};
