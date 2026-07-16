import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/services/auth";
import { toast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await auth.requestPasswordReset(email);
      // Sucesso é sempre exibido, mesmo se o e-mail não existir (anti-enumeração).
      setSent(true);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Erro ao solicitar redefinição";
      toast({
        title: "Não foi possível enviar",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      {sent ? (
        <div className="space-y-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <MailCheck className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-[28px] font-bold text-foreground tracking-[-0.02em] leading-tight">
              Verifique seu e-mail
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Se houver uma conta associada a{" "}
              <strong className="text-foreground">{email}</strong>, enviamos um
              link para redefinir a senha. O link expira em 1 hora.
            </p>
          </div>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-11 font-semibold"
              onClick={() => setSent(false)}
            >
              Usar outro e-mail
            </Button>
            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-[28px] font-bold text-foreground tracking-[-0.02em] leading-tight">
              Esqueceu a senha?
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Digite o e-mail da sua conta e enviaremos um link para você criar
              uma nova senha.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-1 font-semibold text-[14px] tracking-tight rounded-md transition-all duration-200"
            >
              {loading ? "Enviando..." : "Enviar link de redefinição"}
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
      )}
    </AuthShell>
  );
}
