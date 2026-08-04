import { HelpCircle } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatBRLExato } from "@/lib/money";

/**
 * Explica o "Declarado sem detalhe" — o conceito mais confuso do sistema.
 *
 * O extrato de uma instituição declara um saldo; o assessor abre parte dele em
 * ativos; a diferença entra no patrimônio total sem ninguém saber em que está
 * aplicada. Como isso muda o denominador de todo percentual da tela, o número
 * nunca aparece sem esta explicação ao lado.
 *
 * `TooltipProvider` já é global (App.tsx), então não é preciso embrulhar.
 */
export function NaoMapeadoHint({
  declarado,
  mapeado,
  naoMapeado,
}: {
  declarado: number;
  mapeado: number;
  naoMapeado: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground/70 transition-colors hover:text-foreground"
          aria-label="O que é declarado sem detalhe"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">
        O extrato declara {formatBRLExato(declarado)}. {formatBRLExato(mapeado)} já está aberto em
        ativos; os {formatBRLExato(naoMapeado)} restantes contam no patrimônio total, mas ninguém
        sabe em que estão aplicados — nem a IA analisou.
      </TooltipContent>
    </Tooltip>
  );
}
