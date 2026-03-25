import { useState } from "react";
import { Check, ChevronsUpDown, Building2, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

interface OrgSwitcherProps {
  onCreateOrg?: () => void;
}

export const OrgSwitcher = ({ onCreateOrg }: OrgSwitcherProps) => {
  const { user, organizations, switchOrganization } = useAuth();
  const [switching, setSwitching] = useState(false);

  const activeOrgId = user?.organizationId;
  const activeOrg = organizations.find((o) => o.id === activeOrgId);
  const orgName = activeOrg?.name ?? user?.organization?.name ?? "Organização";

  if (organizations.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md">
        <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="text-[12px] text-muted-foreground truncate">{orgName}</span>
      </div>
    );
  }

  const handleSwitch = async (orgId: string) => {
    if (orgId === activeOrgId || switching) return;
    setSwitching(true);
    try {
      await switchOrganization(orgId);
    } catch {
      toast({
        title: "Erro ao trocar organização",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSwitching(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full h-auto justify-between px-2 py-1.5 text-left hover:bg-primary/10 hover:text-primary transition-colors"
          disabled={switching}
        >
          <div className="flex items-center gap-2 min-w-0">
            {switching ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="text-[12px] font-medium truncate">{orgName}</span>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal uppercase tracking-wide">
          Organizações
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitch(org.id)}
            className="flex items-center justify-between gap-2 text-[13px] cursor-pointer"
          >
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate">{org.name}</span>
              <span className="text-[11px] text-muted-foreground">{org.role}</span>
            </div>
            {org.id === activeOrgId && (
              <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        {onCreateOrg && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onCreateOrg}
              className="gap-2 text-[13px] text-muted-foreground cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              Criar nova organização
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
