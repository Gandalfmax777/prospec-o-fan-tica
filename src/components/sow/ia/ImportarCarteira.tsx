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
import { useImportarCarteira, useImportJob, useSoWAtivosCliente } from "@/hooks/sow/useSoW";
import type { SoWImportJob } from "@/types/sow";
import { ImportReview } from "./ImportReview";
import { toast } from "sonner";
import { AlertCircle, FileUp, Loader2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.xlsx,.xls,.csv,image/*";

export function ImportarCarteira({ clienteId }: { clienteId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [initialJob, setInitialJob] = useState<SoWImportJob | null>(null);
  const [stopped, setStopped] = useState(false);
  const [pendente, setPendente] = useState<File | null>(null);

  const importar = useImportarCarteira();
  const { data: ativosAtuais } = useSoWAtivosCliente(clienteId);

  // Reimportar substitui os ativos que vieram de importações anteriores. Os
  // cadastrados à mão ficam, mas o assessor precisa saber antes de enviar.
  const jaImportados = (ativosAtuais ?? []).filter((a) => a.importJobId != null).length;

  const isTerminal = (j?: SoWImportJob | null) =>
    j?.status === "Concluido" || j?.status === "Falhou";

  const { data: polledJob } = useImportJob(jobId, !!jobId && !stopped);
  // polledJob começa undefined até o primeiro fetch — usamos o job inicial.
  const job = polledJob ?? initialJob;

  // Para de fazer polling assim que o job atinge um estado terminal.
  useEffect(() => {
    if (isTerminal(polledJob)) setStopped(true);
  }, [polledJob]);

  const enviar = async (file: File) => {
    setJobId(null);
    setInitialJob(null);
    setStopped(false);
    try {
      const created = await importar.mutateAsync({ clienteId, file });
      setInitialJob(created);
      setJobId(created.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar o arquivo");
    }
  };

  const handleFile = (file: File) => {
    if (!file) return;
    // Só pede confirmação quando há de fato o que substituir.
    if (jaImportados > 0) {
      setPendente(file);
      return;
    }
    void enviar(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const uploading = importar.isPending;
  const processing =
    !!job && (job.status === "Pendente" || job.status === "Processando");
  const concluido = job?.status === "Concluido";
  const falhou = job?.status === "Falhou";
  const busy = uploading || processing;

  const reset = () => {
    setJobId(null);
    setInitialJob(null);
    setStopped(false);
    if (inputRef.current) inputRef.current.value = "";
  };

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
                Arraste o extrato aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Aceita PDF, Excel, CSV e imagem de extrato.
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 pointer-events-none">
              <FileUp className="h-4 w-4" />
              Escolher arquivo
            </Button>
          </CardContent>
        </Card>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {busy && (
        <Card>
          <CardContent className="py-8 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {uploading ? "Enviando arquivo…" : "A IA está lendo a carteira…"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {job?.nomeArquivo
                    ? job.nomeArquivo
                    : "Isso pode levar alguns segundos."}
                </p>
              </div>
            </div>
            <Progress value={uploading ? 25 : 65} className="h-2" />
          </CardContent>
        </Card>
      )}

      {falhou && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível processar</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{job?.erro || "Ocorreu um erro ao ler o arquivo. Tente novamente."}</p>
            <Button variant="outline" size="sm" onClick={reset}>
              Tentar outro arquivo
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {concluido && job && (
        <div className="space-y-3">
          <ImportReview job={job} />
          <Button variant="outline" size="sm" onClick={reset} className="gap-2">
            <UploadCloud className="h-4 w-4" />
            Importar outro arquivo
          </Button>
        </div>
      )}

      <AlertDialog
        open={!!pendente}
        onOpenChange={(o) => {
          if (!o) {
            setPendente(null);
            if (inputRef.current) inputRef.current.value = "";
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Este cliente já tem carteira importada</AlertDialogTitle>
            <AlertDialogDescription>
              {jaImportados} ativo{jaImportados === 1 ? "" : "s"} veio{jaImportados === 1 ? "" : "ram"}{" "}
              de importações anteriores e {jaImportados === 1 ? "será substituído" : "serão substituídos"}{" "}
              pelo conteúdo deste extrato, nas instituições que ele contiver. Ativos que você cadastrou
              à mão não são afetados, e instituições que não aparecerem no arquivo ficam como estão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const file = pendente;
                setPendente(null);
                if (inputRef.current) inputRef.current.value = "";
                if (file) void enviar(file);
              }}
            >
              Substituir e importar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
