import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

export const RegisterForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
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
      await signUp({ email, password, name: name || undefined });
      await new Promise((resolve) => setTimeout(resolve, 100));
      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao sistema!",
      });
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar conta";
      toast({
        title: "Erro ao criar conta",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-11 bg-[hsl(234_16%_14%)] border-[hsl(233_12%,22%)] text-[hsl(214_28%_92%)] placeholder:text-[hsl(215_14%_32%)] focus-visible:ring-[hsl(158_64%_52%/0.2)] focus-visible:border-[hsl(158_64%_52%/0.5)] transition-colors rounded-lg";

  const labelClass =
    "block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[hsl(215_14%_50%)]";

  return (
    <div className="space-y-7">
      {/* Heading */}
      <div className="space-y-2">
        <h2
          className="text-[28px] font-bold text-[hsl(214_28%_93%)] tracking-[-0.02em] leading-tight"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Criar conta
        </h2>
        <p className="text-[hsl(215_14%_52%)] text-sm leading-relaxed">
          Preencha os dados para começar
        </p>
      </div>

      {/* Form */}
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
            className={inputClass}
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
            className={inputClass}
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
            className={inputClass}
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
            className={inputClass}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-1 bg-[hsl(158_64%_52%)] hover:bg-[hsl(158_64%_46%)] text-[hsl(158_30%_8%)] font-semibold text-[14px] tracking-tight transition-all duration-200 shadow-md hover:shadow-lg rounded-lg"
        >
          {loading ? "Criando conta..." : "Criar Conta"}
        </Button>
      </form>
    </div>
  );
};
