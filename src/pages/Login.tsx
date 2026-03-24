import { LoginForm } from "@/components/auth/LoginForm";
import { Link } from "react-router-dom";

const stats = [
  { value: "100%", label: "dados em tempo real" },
  { value: "3×", label: "mais conversões" },
  { value: "∞", label: "leads gerenciados" },
];

export default function Login() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1fr] bg-white">
      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between p-14 relative overflow-hidden"
        style={{ backgroundColor: "#F4F2ED" }}
      >
        {/* Fine dot grid texture */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(circle, #C4BFB0 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Decorative large circle */}
        <div
          className="absolute -bottom-32 -left-32 w-[480px] h-[480px] rounded-full opacity-[0.07]"
          style={{ backgroundColor: "hsl(158, 64%, 42%)" }}
        />
        <div
          className="absolute top-20 right-[-60px] w-[240px] h-[240px] rounded-full opacity-[0.05]"
          style={{ backgroundColor: "hsl(158, 64%, 42%)" }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center border"
            style={{
              backgroundColor: "hsl(158 64% 42% / 0.1)",
              borderColor: "hsl(158 64% 42% / 0.3)",
            }}
          >
            <img src="/shield.svg" className="h-[18px] w-[18px]" alt="Logo" />
          </div>
          <span
            className="font-semibold text-[15px] tracking-tight"
            style={{ fontFamily: "Syne, sans-serif", color: "#2D2B26" }}
          >
            Prospecção Fantástica
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-5">
          <h1
            className="text-[52px] font-bold leading-[1.06] tracking-[-0.03em]"
            style={{ fontFamily: "Syne, sans-serif", color: "#1C1A15" }}
          >
            Prospecção
            <br />
            <span style={{ color: "hsl(158, 60%, 36%)" }}>inteligente.</span>
            <br />
            Resultados reais.
          </h1>
          <p
            className="text-[17px] leading-relaxed max-w-[300px]"
            style={{ color: "#7A7568" }}
          >
            O CRM feito para times de alta performance. Leads, métricas e
            gamificação em um só lugar.
          </p>
        </div>

        {/* Stats */}
        <div
          className="relative z-10 grid grid-cols-3 gap-8 pt-8 border-t"
          style={{ borderColor: "#DDD9CE" }}
        >
          {stats.map((stat) => (
            <div key={stat.label}>
              <p
                className="text-[26px] font-bold leading-none"
                style={{ fontFamily: "Syne, sans-serif", color: "#1C1A15" }}
              >
                {stat.value}
              </p>
              <p className="text-xs mt-1.5 leading-tight" style={{ color: "#9C9789" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-col items-center justify-center p-8 bg-white relative">
        {/* Very subtle top border line */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: "linear-gradient(90deg, hsl(158,60%,42%), hsl(158,60%,60%))" }}
        />

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-md flex items-center justify-center border"
            style={{
              backgroundColor: "hsl(158 64% 42% / 0.08)",
              borderColor: "hsl(158 64% 42% / 0.25)",
            }}
          >
            <img src="/shield.svg" className="h-4 w-4" alt="Logo" />
          </div>
          <span
            className="font-semibold text-sm"
            style={{ fontFamily: "Syne, sans-serif", color: "#2D2B26" }}
          >
            Prospecção
          </span>
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <LoginForm />
          <p className="text-center text-sm mt-8" style={{ color: "#9C9789" }}>
            Não tem uma conta?{" "}
            <Link
              to="/register"
              className="font-medium transition-colors"
              style={{ color: "hsl(158, 60%, 36%)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "hsl(158, 60%, 30%)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "hsl(158, 60%, 36%)")
              }
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
