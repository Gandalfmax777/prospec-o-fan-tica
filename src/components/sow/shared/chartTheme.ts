/**
 * Tema dos gráficos do SoW. Era copiado em CarteirasView e IndicadoresView.
 *
 * CUIDADO COM O TEMA POR TENANT. As `--chart-*` são remapeadas em
 * `[data-tenant="eqi"]` (src/index.css): lá `--chart-1` e `--chart-2` são AMBOS
 * verdes, o âmbar virou `--chart-3` e `--chart-4` é azul. O comentário antigo
 * ("verde = da casa, âmbar = externo") já era falso nesse tema.
 *
 * Duas consequências que este arquivo assume:
 *  1. `--chart-2` é verde nos quatro temas — serve como "da casa".
 *  2. `--chart-4` NÃO é verde em nenhum deles (âmbar no padrão, azul na EQI),
 *     então serve como "externo" — mas por contraste, não por ser âmbar.
 *
 * E a cor nunca é o único sinal: legenda e badge dizem "da casa" por escrito,
 * porque num tema com metade da paleta verde a cor sozinha não distingue nada.
 */

/** Paleta categórica. Ver PALETA_SEM_VERDE quando a fatia verde já estiver em uso. */
export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

/** Da casa (EQI). Verde em todos os temas. */
export const COR_INTERNA = "hsl(var(--chart-2))";
/** Fora da casa. Contrasta com o verde em todos os temas. */
export const COR_EXTERNA = "hsl(var(--chart-4))";
/** Saldo declarado que ninguém abriu em ativos — neutro, de propósito. */
export const COR_NAO_MAPEADO = "hsl(var(--muted-foreground))";

/**
 * Paleta para séries em que UMA fatia já é a interna (verde). Começa no índice 2
 * para nenhuma fatia externa colidir com a cor da casa — no tema EQI,
 * `--chart-1` também é verde, então pular só o índice 1 não bastaria.
 */
export const PALETA_SEM_VERDE = [
  "hsl(var(--chart-4))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1))",
];

export const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

/** Geometria padrão dos donuts do SoW. */
export const donutProps = {
  innerRadius: 60,
  outerRadius: 100,
  paddingAngle: 2,
  dataKey: "value",
  nameKey: "name",
} as const;

/** Borda que separa fatias adjacentes de tom parecido. */
export const cellProps = {
  stroke: "hsl(var(--background))",
  strokeWidth: 2,
} as const;
