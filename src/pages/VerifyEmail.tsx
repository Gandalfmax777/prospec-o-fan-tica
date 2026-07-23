import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, MailWarning } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/services/auth";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

/**
 * Resultado da verificação de e-mail.
 *
 * Esta página NÃO valida o token. O link do e-mail aponta para o backend
 * (`/api/auth/verify-email`), que valida e responde 302 para cá — acrescentando
 * `?error=CODIGO` quando falha. Fazer a validação daqui exigiria chamar a API
 * sem callbackURL, e nesse modo o Better Auth devolve 401 em qualquer falha, o
 * que o interceptor de sessão do front trataria como "sessão inválida",
 * derrubando o login de quem só abriu um link vencido.
 */

type Estado = {
  titulo: string;
  descricao: string;
  permiteReenvio: boolean;
};

// Códigos emitidos por /verify-email (BASE_ERROR_CODES do Better Auth).
const ESTADOS: Record<string, Estado> = {
  TOKEN_EXPIRED: {
    titulo: "Link expirado",
    descricao:
      "Este link de confirmação passou da validade. Peça um novo — leva alguns segundos.",
    permiteReenvio: true,
  },
  INVALID_TOKEN: {
    titulo: "Link inválido",
    descricao:
      "Não foi possível validar este link. Ele pode ter sido copiado pela metade ou alterado no caminho.",
    permiteReenvio: true,
  },
  USER_NOT_FOUND: {
    titulo: "Conta não encontrada",
    descricao:
      "A conta associada a este link não existe mais. Fale com o administrador da sua organização.",
    permiteReenvio: false,
  },
  INVALID_USER: {
    titulo: "Link de outra conta",
    descricao:
      "Este link pertence a outra conta e você está logado com uma diferente. Saia da conta atual e abra o link novamente.",
    permiteReenvio: false,
  },
};

const ESTADO_DESCONHECIDO: Estado = {
  titulo: "Não foi possível confirmar",
  descricao:
    "Algo deu errado ao confirmar seu e-mail. Tente novamente com um link novo.",
  permiteReenvio: true,
};

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const codigoErro = searchParams.get("error");

  const [email, setEmail] = useState(user?.email ?? "");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleReenviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const destino = (user?.email ?? email).trim();
    if (!destino) {
      toast({ title: "Informe seu e-mail", variant: "destructive" });
      return;
    }

    setEnviando(true);
    try {
      await auth.sendVerificationEmail(destino);
      setEnviado(true);
      toast({
        title: "E-mail enviado",
        description: `Se houver uma conta pendente para ${destino}, o link de confirmação chegará em instantes.`,
      });
    } catch (err) {
      // Só cai aqui com sessão ativa: sem sessão o servidor sempre responde 200.
      const msg = err instanceof Error ? err.message : "";
      if (msg.toUpperCase().includes("ALREADY_VERIFIED")) {
        toast({
          title: "E-mail já confirmado",
          description: "Esta conta já está verificada — não é preciso reenviar.",
        });
        setEnviado(true);
      } else {
        toast({
          title: "Não foi possível enviar",
          description: msg || "Tente novamente em instantes.",
          variant: "destructive",
        });
      }
    } finally {
      setEnviando(false);
    }
  };

  // ── Sucesso: sem parâmetro de erro, o backend validou o token ──
  if (!codigoErro) {
    return (
      <AuthShell>
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-11 w-11 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center dark:bg-emerald-950/30 dark:border-emerald-800/50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
            </div>
            <h2 className="text-[28px] font-bold text-foreground tracking-[-0.02em] leading-tight">
              E-mail confirmado
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Pronto — seu endereço está verificado. Você já pode continuar
              usando a plataforma normalmente.
            </p>
          </div>

          <Button asChild className="w-full h-11 font-semibold">
            <Link to={user ? "/" : "/login"}>
              {user ? "Ir para o painel" : "Entrar"}
            </Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  // ── Falha: o backend anexou ?error=CODIGO ao redirecionar ──
  const estado = ESTADOS[codigoErro] ?? ESTADO_DESCONHECIDO;

  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-11 w-11 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center dark:bg-amber-950/30 dark:border-amber-800/50">
            <MailWarning className="h-5 w-5 text-amber-600 dark:text-amber-500" />
          </div>
          <h2 className="text-[28px] font-bold text-foreground tracking-[-0.02em] leading-tight">
            {estado.titulo}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {estado.descricao}
          </p>
        </div>

        {estado.permiteReenvio && !enviado && (
          <form onSubmit={handleReenviar} className="space-y-4">
            {!user && (
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Seu e-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={enviando}
                  className="h-11 rounded-md transition-colors"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={enviando}
              className="w-full h-11 font-semibold text-[14px] tracking-tight rounded-md transition-all duration-200"
            >
              {enviando ? "Enviando..." : "Enviar novo link"}
            </Button>
          </form>
        )}

        {enviado && (
          <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Verifique sua caixa de entrada. Se não encontrar, olhe também o
              spam.
            </p>
          </div>
        )}

        <Link
          to={user ? "/" : "/login"}
          className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {user ? "Voltar para o painel" : "Voltar para o login"}
        </Link>
      </div>
    </AuthShell>
  );
}
