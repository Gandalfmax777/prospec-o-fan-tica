import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { CrmConfig, SaveCrmConfigInput } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Plug,
  RefreshCw,
  Save,
  Settings,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrgSettings } from "./OrgSettings";

// ─── CRM Config Form ──────────────────────────────────────────────────────────

const CrmConfigForm = () => {
  const [config, setConfig] = useState<CrmConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [crmApiUrl, setCrmApiUrl] = useState("");
  const [crmApiKey, setCrmApiKey] = useState("");
  const [defaultPipelineStageId, setDefaultPipelineStageId] = useState("");
  const [autoTransfer, setAutoTransfer] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await api.getCrmConfig();
      setConfig(data);
      if (data) {
        setCrmApiUrl(data.crmApiUrl ?? "");
        setCrmApiKey(data.crmApiKey ?? "");
        setDefaultPipelineStageId(data.defaultPipelineStageId ?? "");
        setAutoTransfer(data.autoTransfer ?? false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar configuração";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!crmApiUrl.trim()) {
      toast({ title: "Campo obrigatório", description: "URL do CRM é obrigatória.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const payload: SaveCrmConfigInput = {
        crmApiUrl: crmApiUrl.trim(),
        defaultPipelineStageId: defaultPipelineStageId.trim() || null,
        autoTransfer,
      };
      if (crmApiKey && !crmApiKey.endsWith("...")) {
        payload.crmApiKey = crmApiKey.trim();
      }
      const updated = await api.saveCrmConfig(payload);
      setConfig((prev) => ({ ...prev, ...updated, crmApiKey: crmApiKey }));
      toast({ title: "Configuração salva", description: "Integração com o CRM atualizada com sucesso." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar configuração";
      toast({ title: "Erro ao salvar", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const result = await api.testCrmConnection();
      if (result.success) {
        toast({ title: "Conexão estabelecida", description: result.message });
      } else {
        toast({ title: "Falha na conexão", description: result.message, variant: "destructive" });
      }
      await loadConfig();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao testar conexão";
      toast({ title: "Erro ao testar", description: message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const renderTestStatus = () => {
    if (!config?.lastTestedAt) return null;
    const testedAt = format(new Date(config.lastTestedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    if (config.lastTestSuccess) {
      return (
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>Último teste bem-sucedido em {testedAt}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <XCircle className="h-4 w-4" />
        <span>Último teste falhou em {testedAt}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Status card */}
      {config ? (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <Plug className="h-5 w-5 text-emerald-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Integração configurada</p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-500">{config.crmApiUrl}</p>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">Ativa</Badge>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Integração não configurada. Preencha os dados abaixo para conectar ao CRM.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conexão com o CRM</CardTitle>
          <CardDescription>
            Configure a URL e a chave de API para transferir leads convertidos ao CRM Boilerplate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="crmApiUrl">URL do CRM</Label>
            <Input
              id="crmApiUrl"
              type="url"
              placeholder="https://meu-crm.vercel.app"
              value={crmApiUrl}
              onChange={(e) => setCrmApiUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">URL base sem barra no final.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="crmApiKey">API Key</Label>
            <Input
              id="crmApiKey"
              type="text"
              placeholder="bdn_live_..."
              value={crmApiKey}
              onChange={(e) => setCrmApiKey(e.target.value)}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Chave com permissões <code className="font-mono">write:contacts</code> e{" "}
              <code className="font-mono">write:deals</code>. Gere em{" "}
              {crmApiUrl ? (
                <a
                  href={`${crmApiUrl}/crm/settings`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Configurações → API Keys <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                "Configurações → API Keys do CRM"
              )}.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultPipelineStageId">
              Estágio padrão do pipeline{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="defaultPipelineStageId"
              placeholder="ID do estágio — deixe vazio para usar o primeiro"
              value={defaultPipelineStageId}
              onChange={(e) => setDefaultPipelineStageId(e.target.value)}
            />
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-4">
            <div className="flex h-5 items-center">
              <input
                id="autoTransfer"
                type="checkbox"
                checked={autoTransfer}
                onChange={(e) => setAutoTransfer(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="autoTransfer" className="text-sm font-medium cursor-pointer">
                Transferência automática
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Leads transferidos automaticamente ao CRM ao serem convertidos.
                <span className="block mt-1 text-amber-600 dark:text-amber-400">(Disponível em breve)</span>
              </p>
            </div>
          </div>

          {renderTestStatus()}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Salvando..." : "Salvar configuração"}
            </Button>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing || !config}
              className="gap-2"
              title={!config ? "Salve a configuração antes de testar" : undefined}
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {testing ? "Testando..." : "Testar conexão"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Como funciona */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {[
            <>O prospector converte um lead na aba <strong className="text-foreground">Convertidos</strong>.</>,
            <>Ao clicar em <strong className="text-foreground">"Transferir para Corretor"</strong>, o lead é enviado ao CRM como contato e negócio.</>,
            <>O corretor recebe o lead no pipeline e dá continuidade ao processo comercial.</>,
            <>O lead transferido exibe um link direto para o negócio no CRM.</>,
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                {i + 1}
              </div>
              <p>{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Settings wrapper com abas ────────────────────────────────────────────────

export const CrmIntegrationSettings = () => {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Configurações</h2>
          <p className="text-sm text-muted-foreground">Organização e integração com o CRM</p>
        </div>
      </div>

      <Tabs defaultValue="org">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="org" className="gap-2">
            <Building2 className="h-4 w-4" />
            Organização
          </TabsTrigger>
          <TabsTrigger value="crm" className="gap-2">
            <Plug className="h-4 w-4" />
            Integração CRM
          </TabsTrigger>
        </TabsList>

        <TabsContent value="org" className="mt-5">
          <OrgSettings />
        </TabsContent>

        <TabsContent value="crm" className="mt-5">
          <CrmConfigForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};
