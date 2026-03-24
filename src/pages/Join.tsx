import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Key, Loader2, Shield } from "lucide-react";

/**
 * Página de aceite de convite por link direto.
 * URL: /join?token=<token>
 *
 * - Se não autenticado: redireciona para /login?redirect=/join?token=xxx
 * - Se autenticado e já tem org: mostra aviso
 * - Se autenticado sem org: aceita diretamente
 */
const Join = () => {
  const { user, loading, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tokenFromUrl = searchParams.get("token") ?? "";
  const [token, setToken] = useState(tokenFromUrl);
  const [joining, setJoining] = useState(false);
  const [autoJoining, setAutoJoining] = useState(false);

  // Se não autenticado, redireciona para login
  useEffect(() => {
    if (!loading && !user) {
      const redirectTo = `/join${tokenFromUrl ? `?token=${tokenFromUrl}` : ""}`;
      navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`, { replace: true });
    }
  }, [loading, user, tokenFromUrl, navigate]);

  // Auto-aceita se token vier na URL e usuário não tem org
  useEffect(() => {
    if (!loading && user && !user.organizationId && tokenFromUrl) {
      setAutoJoining(true);
      api
        .joinOrg({ token: tokenFromUrl })
        .then(async (result) => {
          toast({ title: "Convite aceito!", description: result.message });
          await refreshSession();
          navigate("/", { replace: true });
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : "Token inválido ou expirado";
          toast({ title: "Erro ao aceitar convite", description: message, variant: "destructive" });
        })
        .finally(() => setAutoJoining(false));
    }
  }, [loading, user, tokenFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast({ title: "Token inválido", description: "Cole o token de convite recebido.", variant: "destructive" });
      return;
    }
    try {
      setJoining(true);
      const result = await api.joinOrg({ token: token.trim() });
      toast({ title: "Convite aceito!", description: result.message });
      await refreshSession();
      navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Token inválido ou expirado";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  if (loading || autoJoining) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">
            {autoJoining ? "Aceitando convite..." : "Carregando..."}
          </p>
        </div>
      </div>
    );
  }

  if (user?.organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Você já pertence a uma organização</CardTitle>
            <CardDescription>
              Não é possível aceitar um convite enquanto você já faz parte de uma organização.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/", { replace: true })} className="w-full">
              Ir para o Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.12),_transparent_60%),_linear-gradient(180deg,_hsl(var(--background)),_hsl(var(--muted)/0.5))] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
              <Shield className="h-7 w-7" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Aceitar convite</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Cole o token de convite para entrar na organização.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Token de convite</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Token</Label>
                <Input
                  id="token"
                  placeholder="Cole o token aqui..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={joining}
                  className="font-mono text-sm"
                  autoFocus={!tokenFromUrl}
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={joining}>
                {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                {joining ? "Entrando..." : "Aceitar convite"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Join;
