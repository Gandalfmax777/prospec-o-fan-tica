import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useImportarCarteira,
  useImportJob,
  useSoWAtivosCliente,
  useInvalidateSoW,
} from "@/hooks/sow/useSoW";
import type { SoWImportJob } from "@/types/sow";
import { ImportReview } from "./ImportReview";
import { toast } from "sonner";
import { AlertCircle, FileUp, Loader2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.xlsx,.xls,.csv,image/*";
// Espelha SOW_IMPORT_MAX_FILES no backend. Aviso local só para não deixar o
// assessor esperar um 400 que já dá pra prever.
const MAX_ARQUIVOS = 5;

export function ImportarCarteira({ clienteId }: { clienteId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [initialJob, setInitialJob] = useState<SoWImportJob | null>(null);
  const [stopped, setStopped] = useState(false);
  const [pendentes, setPendentes] = useState<File[]>([]);
  // Escape para não prender o assessor na tela enquanto a IA lê os extratos.
  const [emSegundoPlano, setEmSegundoPlano] = useState(false);

  const importar = useImportarCarteira();
  const invalidarSoW = useInvalidateSoW();
  const { data: ativosAtuais } = useSoWAtivosCliente(clienteId);

  // Reimportar substitui os ativos que vieram de importações anteriores. Os
  // cadastrados à mão ficam, mas o assessor precisa saber antes de enviar.
  const jaImportados = (ativosAtuais ?? []).filter((a) => a.importJobId != null).length;

  const isTerminal = (j?: SoWImportJob | null) =>
    j?.status === "Concluido" || j?.status === "Falhou";

  const { data: polledJob } = useImportJob(jobId, !!jobId && !stopped);
  // polledJob começa undefined até o primeiro fetch — usamos o job inicial.
  const job = polledJob ?? initialJob;

  const uploading = importar.isPending;
  const processing =
    !!job && (job.status === "Pendente" || job.status === "Processando");
  const concluido = job?.status === "Concluido";
  const falhou = job?.status === "Falhou";
  // `emSegundoPlano` só libera a TELA; o job continua rodando, então quem
  // decide se dá para começar outra importação é `emAndamento`, não `busy`.
  const emAndamento = uploading || processing;
  const busy = emAndamento && !emSegundoPlano;

  // Para o polling e recarrega a carteira ao terminar. O job conclui em
  // background: sem invalidar, `jaImportados`, a lista de ativos e o dashboard
  // continuam com os números de antes da importação.
  const finalizadoRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isTerminal(polledJob)) return;
    setStopped(true);
    const id = polledJob?.id ?? null;
    if (id && finalizadoRef.current === id) return;
    finalizadoRef.current = id;
    invalidarSoW();
  }, [polledJob, invalidarSoW]);

  const limparInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const enviar = async (files: File[]) => {
    setJobId(null);
    setInitialJob(null);
    setStopped(false);
    setEmSegundoPlano(false);
    try {
      const created = await importar.mutateAsync({ clienteId, files });
      setInitialJob(created);
      setJobId(created.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar os arquivos");
    } finally {
      // Sem isto o input fica com a mesma seleção: reescolher os mesmos
      // arquivos não dispara `change` e o assessor clica sem nada acontecer.
      limparInput();
    }
  };

  const handleFiles = (files: File[]) => {
    if (files.length === 0) return;
    // Duas importações simultâneas para o mesmo cliente disputariam o
    // recalcClienteCache e uma sobrescreveria a outra por instituição.
    if (emAndamento) {
      toast.error("Já existe uma importação rodando para este cliente. Aguarde ela terminar.");
      limparInput();
      return;
    }
    if (files.length > MAX_ARQUIVOS) {
      toast.error(`Envie no máximo ${MAX_ARQUIVOS} arquivos por vez.`);
      limparInput();
      return;
    }
    // Só pede confirmação quando há de fato o que substituir.
    if (jaImportados > 0) {
      setPendentes(files);
      return;
    }
    void enviar(files);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(Array.from(e.dataTransfer.files ?? []));
  };

  const reset = () => {
    setJobId(null);
    setInitialJob(null);
    setStopped(false);
    setEmSegundoPlano(false);
    limparInput();
  };

  // Nomes dos arquivos do lote em andamento, para o assessor conferir que
  // subiram todos.
  const nomesEmAndamento = job?.nomeArquivo ?? null;

  return (
    <div className="space-y-4">
      {!busy && !concluido && !falhou && (
        <Card
          className={cn(
            "border-2 border-dashed transition-colors cursor-pointer",
            dragging ? "border-primary bg-primary/5" : "border-border/70 hover:border-primary/40"
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="p-3 rounded-full bg-primary/10">
              <UploadCloud className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Arraste os extratos aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Aceita PDF, Excel, CSV e imagem de extrato. Pode enviar até {MAX_ARQUIVOS} de uma
                vez — a IA lê todos juntos e consolida por instituição.
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 pointer-events-none">
              <FileUp className="h-4 w-4" />
              Escolher arquivos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Job segue rodando depois de "deixar em segundo plano": sem este aviso
          a tela parece ociosa e o assessor tenta importar de novo. */}
      {!busy && processing && (
        <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
          <span className="min-w-0 break-words">
            A IA continua lendo {nomesEmAndamento || "os extratos"} em segundo plano. O resultado
            aparece aqui quando terminar.
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
      />

      {busy && (
        <Card>
          <CardContent className="py-8 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {uploading ? "Enviando arquivos…" : "A IA está lendo os extratos…"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 break-words">
                  {nomesEmAndamento || "Isso pode levar alguns segundos."}
                </p>
              </div>
            </div>
            <Progress value={uploading ? 25 : 65} className="h-2" />
            {processing && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setEmSegundoPlano(true)}
              >
                Deixar rodando em segundo plano
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {falhou && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível processar</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{job?.erro || "Ocorreu um erro ao ler os arquivos. Tente novamente."}</p>
            <Button variant="outline" size="sm" onClick={reset}>
              Tentar de novo
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {concluido && job && (
        <div className="space-y-3">
          <ImportReview job={job} />
          <Button variant="outline" size="sm" onClick={reset} className="gap-2">
            <UploadCloud className="h-4 w-4" />
            Importar outros arquivos
          </Button>
        </div>
      )}

      <AlertDialog
        open={pendentes.length > 0}
        onOpenChange={(o) => {
          if (!o) {
            setPendentes([]);
            limparInput();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendentes.length === 1
                ? "Este extrato substitui o que já foi importado?"
                : "Estes extratos substituem o que já foi importado?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              A substituição é <strong>por instituição</strong>: extratos de corretoras que ainda
              não estão na carteira apenas somam. Só perde o conteúdo antigo a instituição que
              aparecer {pendentes.length === 1 ? "neste arquivo" : "nestes arquivos"} — hoje o
              cliente tem {jaImportados}{" "}
              {jaImportados === 1
                ? "ativo vindo de importação anterior"
                : "ativos vindos de importações anteriores"}
              . Ativos que você cadastrou à mão nunca são afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const files = pendentes;
                setPendentes([]);
                limparInput();
                if (files.length) void enviar(files);
              }}
            >
              Importar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
