import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { CrmConfig, SaveCrmConfigInput } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Zap,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Status bar ── */}
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        config
          ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/60 dark:bg-emerald-950/20"
          : "border-amber-200 bg-amber-50/60 dark:border-amber-800/60 dark:bg-amber-950/20"
      }`}>
        {config ? (
          <>
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Integração ativa</p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-500 font-mono truncate">{config.crmApiUrl}</p>
            </div>
            {config.lastTestedAt && (
              <div className="shrink-0 text-right">
                {config.lastTestSuccess ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>
                      {format(new Date(config.lastTestedAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <XCircle className="h-3.5 w-3.5" />
                    <span>
                      Falhou {format(new Date(config.lastTestedAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Integração não configurada. Preencha os dados abaixo.
            </p>
          </>
        )}
      </div>

      {/* ── Formulário ── */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40 bg-muted/20">
          <p className="text-sm font-medium text-foreground">Conexão com o CRM</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure URL e API Key para transferir leads convertidos.
          </p>
        </div>

        <div className="p-5 space-y-5">
          {/* URL */}
          <div className="space-y-1.5">
            <Label htmlFor="crmApiUrl" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              URL do CRM
            </Label>
            <Input
              id="crmApiUrl"
              type="url"
              placeholder="https://meu-crm.com"
              value={crmApiUrl}
              onChange={(e) => setCrmApiUrl(e.target.value)}
              className="font-mono text-sm h-9"
            />
            <p className="text-xs text-muted-foreground">URL base sem barra no final.</p>
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <Label htmlFor="crmApiKey" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              API Key
            </Label>
            <Input
              id="crmApiKey"
              type="text"
              placeholder="bdn_live_..."
              value={crmApiKey}
              onChange={(e) => setCrmApiKey(e.target.value)}
              autoComplete="off"
              className="font-mono text-sm h-9"
            />
            <p className="text-xs text-muted-foreground">
              Precisa das permissões{" "}
              <code className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">write:contacts</code>{" "}
              e{" "}
              <code className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">write:deals</code>.{" "}
              {crmApiUrl ? (
                <a
                  href={`${crmApiUrl}/crm/settings`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary hover:underline"
                >
                  Gerar no CRM <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ) : (
                "Gere em Configurações → API Keys do CRM."
              )}
            </p>
          </div>

          {/* Pipeline stage */}
          <div className="space-y-1.5">
            <Label htmlFor="defaultPipelineStageId" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Estágio do pipeline{" "}
              <span className="normal-case text-muted-foreground/60 font-normal">(opcional)</span>
            </Label>
            <Input
              id="defaultPipelineStageId"
              placeholder="ID do estágio — deixe vazio para usar o primeiro"
              value={defaultPipelineStageId}
              onChange={(e) => setDefaultPipelineStageId(e.target.value)}
              className="font-mono text-sm h-9"
            />
          </div>

          {/* Auto-transfer toggle */}
          <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
            <input
              id="autoTransfer"
              type="checkbox"
              checked={autoTransfer}
              onChange={(e) => setAutoTransfer(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
            />
            <div className="flex-1">
              <Label htmlFor="autoTransfer" className="text-sm font-medium cursor-pointer">
                Transferência automática
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Transfere leads automaticamente ao converter.{" "}
                <span className="text-muted-foreground">Em breve.</span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2 h-8 px-4">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing || !config}
              size="sm"
              className="gap-2 h-8 px-4"
              title={!config ? "Salve a configuração antes de testar" : undefined}
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {testing ? "Testando..." : "Testar conexão"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Como funciona ── */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40 bg-muted/20">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Como funciona
          </p>
        </div>
        <div className="p-5">
          <ol className="space-y-3">
            {[
              <>O prospector converte um lead na aba <strong className="text-foreground font-medium">Convertidos</strong>.</>,
              <>Ao clicar em <strong className="text-foreground font-medium">"Transferir para Corretor"</strong>, o lead vai para o CRM como contato e negócio.</>,
              <>O corretor recebe o lead no pipeline e segue o processo comercial.</>,
              <>O lead exibe um link direto para o negócio no CRM.</>,
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

// ─── Settings page wrapper ─────────────────────────────────────────────────

export const CrmIntegrationSettings = () => {
  return (
    <div className="mx-auto max-w-2xl w-full space-y-6">
      {/* ── Page header ── */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Settings className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Configurações</h2>
        </div>
        <p className="text-sm text-muted-foreground pl-[42px]">
          Gerencie sua organização e a integração com o CRM.
        </p>
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-border/60" />

      {/* ── Tabs ── */}
      <Tabs defaultValue="org">
        <TabsList className="h-9 bg-muted/50 border border-border/50 p-0.5 gap-0.5">
          <TabsTrigger
            value="org"
            className="h-8 gap-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Building2 className="h-3.5 w-3.5" />
            Organização
          </TabsTrigger>
          <TabsTrigger
            value="crm"
            className="h-8 gap-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Plug className="h-3.5 w-3.5" />
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
