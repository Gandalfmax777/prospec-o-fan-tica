import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn({ email, password });
      await new Promise((resolve) => setTimeout(resolve, 100));
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      });
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao fazer login";
      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-2">
        <h2 className="text-[28px] font-bold text-foreground tracking-[-0.02em] leading-tight">
          Bem-vindo de volta
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Entre com sua conta para continuar
        </p>
      </div>

      {/* Form */}
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

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
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
          <div className="flex justify-end pt-1">
            <Link
              to="/forgot-password"
              className="text-[12px] text-primary hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-1 font-semibold text-[14px] tracking-tight rounded-md transition-all duration-200"
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
};
