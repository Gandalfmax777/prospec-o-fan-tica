import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
        <h2
          className="text-[28px] font-bold tracking-[-0.02em] leading-tight"
          style={{ fontFamily: "Syne, sans-serif", color: "#1C1A15" }}
        >
          Bem-vindo de volta
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "#9C9789" }}>
          Entre com sua conta para continuar
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-[10.5px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "#7A7568" }}
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
            className="h-11 rounded-lg border text-[14px] transition-all duration-200"
            style={{
              backgroundColor: "#FAFAF8",
              borderColor: "#E2DED6",
              color: "#1C1A15",
            }}
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-[10.5px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "#7A7568" }}
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
            className="h-11 rounded-lg border text-[14px] transition-all duration-200"
            style={{
              backgroundColor: "#FAFAF8",
              borderColor: "#E2DED6",
              color: "#1C1A15",
            }}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-1 font-semibold text-[14px] tracking-tight rounded-lg transition-all duration-200 border-0"
          style={{
            backgroundColor: loading
              ? "hsl(158, 60%, 46%)"
              : "hsl(158, 60%, 38%)",
            color: "#FFFFFF",
            boxShadow: loading
              ? "none"
              : "0 1px 3px hsl(158 60% 30% / 0.25), 0 4px 12px hsl(158 60% 42% / 0.18)",
          }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
};
