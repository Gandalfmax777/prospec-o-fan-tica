import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

const labelClass =
  "block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground";

export const RegisterForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, refreshSession } = useAuth();

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // ── Sem token: acesso bloqueado ─────────────────────────────────────────────
  if (!token) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-[28px] font-bold text-foreground tracking-[-0.02em] leading-tight">
            Acesso restrito
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            O registro está disponível apenas por convite.
          </p>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-md border border-destructive/30 bg-destructive/5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Você precisa de um convite válido para criar uma conta. Entre em contato com o
            administrador da sua organização.
          </span>
        </div>

        <Link
          to="/login"
          className="block text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          ← Ir para o login
        </Link>
      </div>
    );
  }

  // ── Com token: formulário de registro ──────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Criar conta
      await signUp({ email, password, name: name || undefined });
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 2. Aceitar o convite automaticamente
      await api.joinOrg({ token });

      // 3. Atualizar a sessão para refletir a organização recém-ingressada
      //    (com o papel do convite, ex. SELLER). Sem isso o AuthGuard ainda
      //    veria organizationId=null e redirecionaria para /onboarding, onde
      //    o usuário criaria a própria org e viraria ADMIN por engano.
      await refreshSession();

      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao sistema!",
      });

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Erro ao criar conta";

      // Tratar erro específico de convite inválido / e-mail não convidado
      const isInviteError =
        raw.toLowerCase().includes("invite") ||
        raw.toLowerCase().includes("convite") ||
        raw.toLowerCase().includes("forbidden");

      toast({
        title: isInviteError ? "Convite inválido" : "Erro ao criar conta",
        description: isInviteError
          ? "Este e-mail não possui um convite válido ou o convite expirou."
          : raw,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h2 className="text-[28px] font-bold text-foreground tracking-[-0.02em] leading-tight">
          Criar conta
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Preencha os dados para começar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className={labelClass}>
            Nome (opcional)
          </label>
          <Input
            id="name"
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="h-11 rounded-md transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="h-11 rounded-md transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className={labelClass}>
            Senha
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="h-11 rounded-md transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirmar Senha
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            className="h-11 rounded-md transition-colors"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-1 font-semibold text-[14px] tracking-tight rounded-md transition-all duration-200"
        >
          {loading ? "Criando conta..." : "Criar Conta"}
        </Button>
      </form>
    </div>
  );
};
