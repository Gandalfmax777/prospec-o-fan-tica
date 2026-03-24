import { LoginForm } from "@/components/auth/LoginForm";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="dark min-h-screen grid lg:grid-cols-2">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex flex-col justify-between p-14 relative overflow-hidden bg-[hsl(235,20%,6%)]">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_10%_100%,hsl(158_64%_52%/0.13),transparent)]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(214 28% 92%) 1px, transparent 1px), linear-gradient(90deg, hsl(214 28% 92%) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[hsl(158_64%_52%/0.12)] border border-[hsl(158_64%_52%/0.25)] flex items-center justify-center">
            <img src="/shield.svg" className="h-4.5 w-4.5 opacity-90" alt="Logo" />
          </div>
          <span
            className="text-[hsl(214_28%_88%)] font-semibold text-[15px] tracking-tight"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Prospecção Fantástica
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-5">
          <h1
            className="text-[52px] font-bold text-[hsl(214_28%_93%)] leading-[1.07] tracking-[-0.03em]"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Prospecção
            <br />
            <span className="text-[hsl(158_64%_52%)]">inteligente.</span>
            <br />
            Resultados reais.
          </h1>
          <p className="text-[hsl(215_14%_54%)] text-[17px] leading-relaxed max-w-[320px]">
            O CRM feito para times de alta performance. Leads, métricas e
            gamificação em um só lugar.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-8 pt-8 border-t border-[hsl(233_12%,18%)]">
          {[
            { value: "100%", label: "dados em tempo real" },
            { value: "3×", label: "mais conversões" },
            { value: "∞", label: "leads gerenciados" },
          ].map((stat) => (
            <div key={stat.label}>
              <p
                className="text-[26px] font-bold text-[hsl(214_28%_93%)] leading-none"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                {stat.value}
              </p>
              <p className="text-xs text-[hsl(215_14%_48%)] mt-1.5 leading-tight">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-col items-center justify-center p-8 bg-[hsl(235_18%_8%)] relative">
        {/* Subtle top glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,hsl(158_64%_52%/0.07),transparent)]" />

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-[hsl(158_64%_52%/0.12)] border border-[hsl(158_64%_52%/0.25)] flex items-center justify-center">
            <img src="/shield.svg" className="h-4 w-4 opacity-90" alt="Logo" />
          </div>
          <span
            className="text-[hsl(214_28%_88%)] font-semibold text-sm"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Prospecção
          </span>
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <LoginForm />
          <p className="text-center text-sm text-[hsl(215_14%_46%)] mt-8">
            Não tem uma conta?{" "}
            <Link
              to="/register"
              className="text-[hsl(158_64%_52%)] hover:text-[hsl(158_64%_60%)] transition-colors font-medium"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
