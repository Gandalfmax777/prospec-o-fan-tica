import { RegisterForm } from "@/components/auth/RegisterForm";
import { Link } from "react-router-dom";

const stats = [
  { value: "100%", label: "dados em tempo real" },
  { value: "3×", label: "mais conversões" },
  { value: "∞", label: "contatos gerenciados" },
];

export default function Register() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1fr] bg-white">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex flex-col justify-between p-14 relative overflow-hidden bg-secondary">
        {/* Fine dot grid texture */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: "radial-gradient(circle, hsl(215 20% 75%) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Decorative circles */}
        <div className="absolute -bottom-32 -left-32 w-[480px] h-[480px] rounded-full opacity-[0.08] bg-primary" />
        <div className="absolute top-20 right-[-60px] w-[240px] h-[240px] rounded-full opacity-[0.05] bg-primary" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center">
            <img src="/shield.svg" className="h-[18px] w-[18px]" alt="Logo" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-foreground">
            Prospecção Fantástica
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-5">
          <h1 className="text-[52px] font-bold leading-[1.06] tracking-[-0.03em] text-foreground">
            Comece a
            <br />
            <span className="text-primary">converter</span>
            <br />
            mais contatos.
          </h1>
          <p className="text-[17px] leading-relaxed max-w-[300px] text-muted-foreground">
            Crie sua conta e acesse o CRM de alta performance para times de
            vendas ambiciosos.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-8 pt-8 border-t border-border">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-[26px] font-bold leading-none text-foreground">
                {stat.value}
              </p>
              <p className="text-xs mt-1.5 leading-tight text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-col items-center justify-center p-8 bg-white relative">
        {/* Accent top bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary" />

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/25 flex items-center justify-center">
            <img src="/shield.svg" className="h-4 w-4" alt="Logo" />
          </div>
          <span className="font-semibold text-sm text-foreground">
            Prospecção
          </span>
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <RegisterForm />
          <p className="text-center text-sm mt-8 text-muted-foreground">
            Já tem uma conta?{" "}
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
