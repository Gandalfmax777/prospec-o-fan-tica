import { ensureHttpsInProduction } from "@/lib/utils";
import type { LoginInput, RegisterInput, Session, User } from "@/types/auth";

const AUTH_URL = ensureHttpsInProduction(
  import.meta.env.VITE_BETTER_AUTH_URL || "http://localhost:3333/api/auth"
);

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

    // Lê o texto primeiro para verificar se é null
    const text = await response.text();
    let responseData: unknown;

    // Tenta fazer parse do JSON
    if (text.trim() === "" || text.trim() === "null") {
      responseData = null;
    } else {
      try {
        responseData = JSON.parse(text);
      } catch (e) {
        // Não loga o texto da resposta para evitar expor dados sensíveis
        console.error("Erro ao fazer parse do JSON da resposta");
        responseData = null;
      }
    }

    if (!response.ok) {
      const errorData = responseData as {
        error?: string | { message: string };
        message?: string;
      } | null;
      const errorMessage =
        (errorData && typeof errorData === "object" && "error" in errorData
          ? typeof errorData.error === "string"
            ? errorData.error
            : errorData.error?.message
          : errorData && typeof errorData === "object" && "message" in errorData
          ? errorData.message
          : undefined) || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage || "Erro desconhecido");
    }

    return responseData as T;
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
      // Não loga a resposta completa para evitar expor dados sensíveis (tokens, etc)
      console.error(
        "Resposta inválida do servidor: usuário não encontrado no sign-in"
      );
      throw new Error("Resposta inválida do servidor: usuário não encontrado");
    }

    // Converte as datas de string para Date
    const user: User = {
      ...userRaw,
      createdAt: new Date(userRaw.createdAt),
      updatedAt: new Date(userRaw.updatedAt),
    };

    // Se já tiver session na resposta, usa ela (convertendo datas se necessário)
    if (sessionFromResponse) {
      const session: Session = {
        ...sessionFromResponse,
        expiresAt: new Date(sessionFromResponse.expiresAt),
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
      // Não loga a resposta completa para evitar expor dados sensíveis (tokens, etc)
      console.error(
        "Resposta inválida do servidor: usuário não encontrado no sign-up"
      );
      throw new Error("Resposta inválida do servidor: usuário não encontrado");
    }

    // Converte as datas de string para Date
    const user: User = {
      ...userRaw,
      createdAt: new Date(userRaw.createdAt),
      updatedAt: new Date(userRaw.updatedAt),
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
          user: Omit<User, "createdAt" | "updatedAt"> & {
            createdAt: string;
            updatedAt: string;
          };
          session?: Omit<Session, "expiresAt" | "user"> & {
            expiresAt: string;
          };
        };
        user?: Omit<User, "createdAt" | "updatedAt"> & {
          createdAt: string;
          updatedAt: string;
        };
        session?: Omit<Session, "expiresAt" | "user"> & {
          expiresAt: string;
        };
      }>("/get-session", {
        method: "GET",
      });

      // Se a resposta for null, retorna null
      if (response === null || response === undefined) {
        console.warn(
          "get-session: resposta é null/undefined - cookies podem não estar sendo enviados"
        );
        return null;
      }

      // Better Auth pode retornar data.user/session ou diretamente user/session
      const userRaw = response.data?.user || response.user;
      const sessionRaw = response.data?.session || response.session;

      if (!userRaw) {
        // Não loga a resposta completa para evitar expor dados sensíveis
        console.warn("get-session: usuário não encontrado na resposta");
        return null;
      }

      // Converte as datas de string para Date
      const user: User = {
        ...userRaw,
        createdAt: new Date(userRaw.createdAt),
        updatedAt: new Date(userRaw.updatedAt),
      };

      // Se não tiver session na resposta, constrói uma básica
      let session: Session;
      if (sessionRaw) {
        session = {
          ...sessionRaw,
          expiresAt: new Date(sessionRaw.expiresAt),
          user: user,
        };
      } else {
        // Se não tiver session, cria uma básica (o Better Auth pode não retornar session em get-session)
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        session = {
          id: user.id,
          userId: user.id,
          expiresAt: expiresAt,
          token: "",
          ipAddress: null,
          userAgent: null,
          user: user,
        };
      }

      return {
        user,
        session,
      };
    } catch (error) {
      console.error("Erro ao obter sessão:", error);
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
