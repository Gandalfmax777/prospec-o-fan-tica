import { useState } from "react";
import { MailWarning, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/services/auth";
import { toast } from "@/hooks/use-toast";

/**
 * Aviso para quem está logado com o e-mail ainda não verificado.
 *
 * Hoje isso não bloqueia nada — a verificação ainda não é exigida. O aviso
 * serve para a base ir se verificando antes de a exigência entrar, sem que
 * ninguém seja pego de surpresa depois.
 *
 * Quem entrou por convite já chega verificado (a posse do token do convite
 * prova o endereço), então na prática este banner aparece para contas antigas,
 * anteriores a este fluxo.
 */
export const EmailNaoVerificadoBanner = () => {
  const { user } = useAuth();
  const [dispensado, setDispensado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  if (!user || user.emailVerified || dispensado) return null;

  const handleEnviar = async () => {
    setEnviando(true);
    try {
      // Com sessão ativa o servidor exige que o e-mail seja o da própria
      // sessão (responde 400 EMAIL_MISMATCH caso contrário), então usamos
      // user.email e não uma entrada livre.
      await auth.sendVerificationEmail(user.email);
      setEnviado(true);
      toast({
        title: "E-mail de confirmação enviado",
        description: `Enviamos um link para ${user.email}. Verifique também o spam.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toUpperCase().includes("ALREADY_VERIFIED")) {
        // A sessão em memória está defasada — o e-mail já foi confirmado.
        setDispensado(true);
        toast({ title: "E-mail já confirmado" });
      } else {
        toast({
          title: "Não foi possível enviar",
          description: msg || "Tente novamente em instantes.",
          variant: "destructive",
        });
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Alert className="flex items-center justify-between gap-3 pr-2 border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200">
      <div className="flex items-start gap-2.5 min-w-0">
        <MailWarning className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <AlertTitle className="mb-0.5">Confirme seu e-mail</AlertTitle>
          <AlertDescription className="text-[13px] leading-relaxed">
            {enviado
              ? `Link enviado para ${user.email}. Abra a mensagem para concluir.`
              : `Ainda não confirmamos ${user.email}. Isso levará alguns segundos.`}
          </AlertDescription>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!enviado && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-amber-400 bg-transparent hover:bg-amber-100 dark:hover:bg-amber-900/40"
            onClick={handleEnviar}
            disabled={enviando}
          >
            {enviando ? "Enviando..." : "Enviar link"}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-current hover:bg-amber-100 dark:hover:bg-amber-900/40"
          onClick={() => setDispensado(true)}
          aria-label="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Alert>
  );
};
