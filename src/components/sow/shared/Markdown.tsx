import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Renderiza o Markdown que o backend devolve nas análises de IA.
 *
 * Antes o texto caía num `whitespace-pre-wrap` e o assessor lia "## Alocação",
 * "**R$ 200.000**" e "---" literalmente na tela. O `remark-gfm` é necessário
 * porque o prompt pede tabela quando a comparação tem três colunas ou mais.
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert",
        // O `prose` traz cores próprias; sobrescrevemos para o texto seguir os
        // tokens do tema em vez de destoar do resto da tela.
        "prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground",
        "prose-strong:text-foreground prose-td:text-muted-foreground prose-th:text-foreground",
        "prose-headings:font-semibold prose-h2:text-base prose-h3:text-sm",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Tabela larga rola dentro do próprio bloco: sem isto ela empurra a
          // largura do card e a página inteira ganha scroll horizontal.
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto">
              <table {...props} />
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
