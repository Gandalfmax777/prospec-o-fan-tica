import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

const TAMANHOS = [25, 50, 100];

/**
 * Sobe do elemento até achar um ancestral que contenha a tabela paginada.
 * Os controles ficam embaixo da lista, então trocar de página sem rolar
 * deixaria o usuário olhando o ÚLTIMO registro da página nova.
 * Devolve null se não houver tabela — aí não rola, e está tudo bem.
 */
function tabelaAcima(el: HTMLElement | null) {
  for (let n = el?.parentElement; n; n = n.parentElement) {
    const t = n.querySelector("table");
    if (t) return t;
  }
  return null;
}

/**
 * Controles de paginação para lista em memória. Usa Button, não o
 * components/ui/pagination do shadcn — aquele é feito para paginação por URL
 * (renderiza `<a>` com href) e aqui não há rota por página.
 *
 * O resumo "X–Y de Z" aparece sempre, porque o total é informação útil por si.
 * A navegação some quando há uma página só.
 */
export function PaginacaoControles({
  pagina,
  totalPaginas,
  total,
  primeiroItem,
  ultimoItem,
  tamanho,
  setTamanho,
  anterior,
  proxima,
  rotuloItem = "registro",
}: {
  pagina: number;
  totalPaginas: number;
  total: number;
  primeiroItem: number;
  ultimoItem: number;
  tamanho: number;
  setTamanho: (n: number) => void;
  anterior: () => void;
  proxima: () => void;
  /** Singular; o plural é formado com "s". Ex.: "contato" → "contatos". */
  rotuloItem?: string;
}) {
  const rotulo = total === 1 ? rotuloItem : `${rotuloItem}s`;
  const raiz = useRef<HTMLDivElement>(null);

  const navegar = (fn: () => void) => {
    fn();
    tabelaAcima(raiz.current)?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  return (
    <div
      ref={raiz}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-3"
    >
      <p className="text-xs text-muted-foreground">
        {total === 0
          ? `Nenhum ${rotuloItem}`
          : `${primeiroItem}–${ultimoItem} de ${total} ${rotulo}`}
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Por página</span>
          <Select
            value={String(tamanho)}
            onValueChange={(v) => navegar(() => setTamanho(Number(v)))}
          >
            <SelectTrigger className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAMANHOS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 px-2"
              onClick={() => navegar(anterior)}
              disabled={pagina === 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {pagina} de {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 px-2"
              onClick={() => navegar(proxima)}
              disabled={pagina === totalPaginas}
              aria-label="Próxima página"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
