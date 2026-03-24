import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Building2, Key, Loader2, Shield } from "lucide-react";

const Onboarding = () => {
  const { refreshSession, signOut } = useAuth();
  const navigate = useNavigate();

  // Criar organização
  const [orgName, setOrgName] = useState("");
  const [creating, setCreating] = useState(false);

  // Entrar com convite
  const [inviteToken, setInviteToken] = useState("");
  const [joining, setJoining] = useState(false);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || orgName.trim().length < 2) {
      toast({ title: "Nome inválido", description: "O nome deve ter pelo menos 2 caracteres.", variant: "destructive" });
      return;
    }
    try {
      setCreating(true);
      await api.createOrg({ name: orgName.trim() });
      toast({ title: "Organização criada!", description: `Bem-vindo à ${orgName.trim()}!` });
      await refreshSession();
      navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar organização";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) {
      toast({ title: "Token inválido", description: "Cole o token de convite recebido.", variant: "destructive" });
      return;
    }
    try {
      setJoining(true);
      const result = await api.joinOrg({ token: inviteToken.trim() });
      toast({ title: "Convite aceito!", description: result.message });
      await refreshSession();
      navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao aceitar convite";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.12),_transparent_60%),_linear-gradient(180deg,_hsl(var(--background)),_hsl(var(--muted)/0.5))] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
              <Shield className="h-7 w-7" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Bem-vindo ao CDR</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Para continuar, crie sua organização ou entre com um convite.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Criar organização</TabsTrigger>
            <TabsTrigger value="join">Entrar com convite</TabsTrigger>
          </TabsList>

          {/* Criar organização */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Nova organização</CardTitle>
                </div>
                <CardDescription>
                  Crie a organização da sua equipe de prospecção. Você será o administrador.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateOrg} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Nome da organização</Label>
                    <Input
                      id="orgName"
                      placeholder="Ex: Imobiliária Alpha"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      disabled={creating}
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={creating}>
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                    {creating ? "Criando..." : "Criar organização"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Entrar com convite */}
          <TabsContent value="join">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Aceitar convite</CardTitle>
                </div>
                <CardDescription>
                  Cole o token de convite enviado pelo administrador da sua organização.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoinOrg} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteToken">Token de convite</Label>
                    <Input
                      id="inviteToken"
                      placeholder="Cole o token aqui..."
                      value={inviteToken}
                      onChange={(e) => setInviteToken(e.target.value)}
                      disabled={joining}
                      autoFocus
                      className="font-mono text-sm"
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={joining}>
                    {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                    {joining ? "Entrando..." : "Aceitar convite"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Logout link */}
        <p className="text-center text-xs text-muted-foreground">
          Conta errada?{" "}
          <button
            onClick={() => signOut().then(() => navigate("/login", { replace: true }))}
            className="text-primary hover:underline"
          >
            Sair
          </button>
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
