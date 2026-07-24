// Helpers monetários do SoW. Valores vêm do backend como number em reais.

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const brlCents = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** R$ 1.234.567 (sem centavos — para KPIs e cards). */
export function formatBRL(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "R$ 0";
  return brl.format(v);
}

/** R$ 1.234,56 (com centavos — para valores exatos de ativos). */
export function formatBRLExato(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "R$ 0,00";
  return brlCents.format(v);
}

/** Compacto: R$ 8,4 mi / R$ 350 mil. */
export function formatBRLCompacto(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "R$ 0";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (abs >= 1_000) return `R$ ${(v / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`;
  return formatBRL(v);
}

/** 34% */
export function formatPct(v: number | null | undefined, casas = 0): string {
  if (v == null || Number.isNaN(v)) return "0%";
  return `${v.toLocaleString("pt-BR", { maximumFractionDigits: casas })}%`;
}

/** Converte uma string digitada ("1.234,56" ou "1234.56") em number em reais. */
export function parseBRL(input: string): number {
  if (!input) return 0;
  const cleaned = input
    .replace(/[^\d.,-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "") // remove separador de milhar
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : n;
}
