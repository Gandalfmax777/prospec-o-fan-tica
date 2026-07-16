import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/services/auth";
import { toast } from "@/hooks/use-toast";

const MIN_LENGTH = 8;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < MIN_LENGTH) {
      toast({
        title: "Senha muito curta",
        description: `A senha precisa ter pelo menos ${MIN_LENGTH} caracteres.`,
        variant: "destructive",
      });
      return;
    }
    if (password !== confirm) {
      toast({
        title: "As senhas não coincidem",
        description: "Confirme a nova senha corretamente.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await auth.resetPassword(token, password);
      toast({
        title: "Senha redefinida!",
        description: "Já pode entrar com a sua nova senha.",
      });
      navigate("/login", { replace: true });
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Não foi possível redefinir a senha";
      toast({
        title: "Erro ao redefinir",
        description:
          msg +
          " — o link pode ter expirado. Solicite um novo em 'Esqueci minha senha'.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Link inválido/ausente
  if (!token) {
    return (
      <AuthShell>
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-[28px] font-bold text-foreground tracking-[-0.02em] leading-tight">
              Link inválido
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Este link de redefinição é inválido ou está incompleto. Solicite um
              novo link para continuar.
            </p>
          </div>
          <Button asChild className="w-full h-11 font-semibold">
            <Link to="/forgot-password">Solicitar novo link</Link>
          </Button>
          <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-[28px] font-bold text-foreground tracking-[-0.02em] leading-tight">
            Criar nova senha
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Escolha uma nova senha para a sua conta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Nova senha
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={MIN_LENGTH}
              className="h-11 rounded-md transition-colors"
            />
            <p className="text-[11px] text-muted-foreground">
              Mínimo de {MIN_LENGTH} caracteres.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirm"
              className="block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Confirmar nova senha
            </label>
            <Input
              id="confirm"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={loading}
              minLength={MIN_LENGTH}
              className="h-11 rounded-md transition-colors"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-1 font-semibold text-[14px] tracking-tight rounded-md transition-all duration-200"
          >
            {loading ? "Salvando..." : "Redefinir senha"}
          </Button>
        </form>

        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      </div>
    </AuthShell>
  );
}
