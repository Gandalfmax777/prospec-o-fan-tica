import { Settings } from "lucide-react";
import { OrgSettings } from "./OrgSettings";

// ─── Settings page ─────────────────────────────────────────────────────────
// Página de "Configurações". A integração com CRM externo foi removida da UI;
// aqui só ficam as configurações da organização.

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
          Gerencie sua organização.
        </p>
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-border/60" />

      <OrgSettings />
    </div>
  );
};
