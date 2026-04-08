import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { CRMProvider } from "@/context/CRMContext";
import { useAuth } from "@/context/AuthContext";
import { DashboardHeader } from "@/components/crm/DashboardHeader";
import { LeadTable } from "@/components/crm/LeadTable";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { ConvertidosTab } from "@/components/crm/ConvertidosTab";
import { MetricasTab } from "@/components/crm/MetricasTab";
import { PendenciasTab } from "@/components/crm/PendenciasTab";
import { GamificacaoTab } from "@/components/crm/GamificacaoTab";
import { AlertaBanner } from "@/components/crm/AlertaBanner";
import { LeaderDashboard } from "@/components/crm/LeaderDashboard";
import { SellerDetails } from "@/components/crm/SellerDetails";
import { CrmIntegrationSettings } from "@/components/crm/CrmIntegrationSettings";
import { AgendaTab } from "@/components/crm/AgendaTab";
import { OrgSwitcher } from "@/components/crm/OrgSwitcher";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Table,
  Kanban,
  CheckCircle,
  BarChart3,
  AlertTriangle,
  Trophy,
  LogOut,
  Settings,
  Users,
  Sun,
  Moon,
  Calendar,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const CRMDashboard = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const { signOut, user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const isLeader = user?.role === "LEADER" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";
  const isDark = resolvedTheme === "dark";

  const roleLabel = (user?.role || "SELLER").toUpperCase();
  const initials =
    user?.name?.slice(0, 2).toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    "US";

  const navItems = useMemo(
    () =>
      [
        { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { key: "leads", label: "Contatos", icon: Table },
        { key: "kanban", label: "Kanban", icon: Kanban },
        { key: "convertidos", label: "Convertidos", icon: CheckCircle },
        { key: "metricas", label: "Métricas", icon: BarChart3 },
        { key: "pendencias", label: "Pendências", icon: AlertTriangle },
        { key: "gamificacao", label: "Gamificação", icon: Trophy },
        { key: "agenda", label: "Agenda", icon: Calendar },
        ...(isLeader ? [{ key: "leader", label: "Liderança", icon: Users }] : []),
        ...(isAdmin ? [{ key: "settings", label: "Configurações", icon: Settings }] : []),
      ],
    [isLeader, isAdmin]
  );

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
      navigate("/login", { replace: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao fazer logout";
      toast({
        title: "Erro ao fazer logout",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSellerClick = (sellerId: string) => {
    setSelectedSellerId(sellerId);
    setActiveView("sellerDetails");
  };

  const handleBackToLeader = () => {
    setSelectedSellerId(null);
    setActiveView("leader");
  };

  const renderView = () => {
    if (activeView === "leader" && !isLeader) return <DashboardHeader />;
    if (activeView === "sellerDetails" && selectedSellerId) {
      return <SellerDetails sellerId={selectedSellerId} onBack={handleBackToLeader} />;
    }

    switch (activeView) {
      case "dashboard":
        return (
          <div className="space-y-5">
            <DashboardHeader />
            <LeadTable />
          </div>
        );
      case "leads":        return <LeadTable />;
      case "kanban":       return <KanbanBoard />;
      case "convertidos":  return <ConvertidosTab />;
      case "metricas":     return <MetricasTab />;
      case "pendencias":   return <PendenciasTab />;
      case "gamificacao":  return <GamificacaoTab />;
      case "agenda":       return <AgendaTab />;
      case "leader":       return <LeaderDashboard onSellerClick={handleSellerClick} />;
      case "settings":     return <CrmIntegrationSettings />;
      default:             return <DashboardHeader />;
    }
  };

  return (
    <SidebarProvider>
      {/* ── Sidebar ── */}
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border/60">

        {/* Logo / brand */}
        <SidebarHeader className="p-4 pb-3">
          <div className="flex items-center gap-2.5 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <img src="/shield.svg" className="h-4 w-4 opacity-90" alt="Logo" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden min-w-0">
              <p
                className="text-[13px] font-bold text-foreground tracking-tight leading-tight truncate"
              >
                Prospecção
              </p>
              <p className="text-[11px] text-muted-foreground truncate">CRM & Performance</p>
            </div>
          </div>
        </SidebarHeader>

        {/* Navigation — SidebarGroup already has p-2, so don't add extra px to SidebarContent */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      onClick={() => setActiveView(item.key)}
                      isActive={activeView === item.key}
                      tooltip={item.label}
                      className="rounded-md text-[13px] font-medium transition-colors duration-150 hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer — user info (hidden when collapsed) */}
        <SidebarFooter className="p-2 border-t border-sidebar-border/50">
          {/* Expanded: org switcher */}
          <div className="group-data-[collapsible=icon]:hidden mb-1">
            <OrgSwitcher onCreateOrg={() => setActiveView("createOrg")} />
          </div>

          {/* Expanded: full user info row */}
          <div className="group-data-[collapsible=icon]:hidden flex items-center gap-2.5 rounded-lg px-2 py-2">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-foreground truncate leading-tight">
                {user?.name || user?.email}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">{roleLabel}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Sair da conta"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Collapsed: logout icon only, centered */}
          <div className="hidden group-data-[collapsible=icon]:flex justify-center py-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted/60"
                  title="Conta"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-44">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {user?.name || user?.email}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{roleLabel}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 text-[13px]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair da conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* ── Main content ── */}
      <SidebarInset className="bg-background">

        {/* Header — title + theme toggle only, no duplicate user info */}
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 md:px-5 h-14">

            {/* Left: trigger + title */}
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground" />
              <div>
                <h1
                  className="text-[15px] font-bold text-foreground tracking-tight leading-tight"
                >
                  Central de Prospecção
                </h1>
                <p className="text-[11.5px] text-muted-foreground hidden sm:block leading-tight">
                  Gestão de prospecção e produtividade
                </p>
              </div>
            </div>

            {/* Right: theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
            >
              {isDark ? (
                <Sun className="h-[15px] w-[15px]" />
              ) : (
                <Moon className="h-[15px] w-[15px]" />
              )}
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 md:px-6 py-5 space-y-4 min-w-0">
          <AlertaBanner onNavigate={setActiveView} />
          <div className="animate-fade-up">
            {renderView()}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

const Index = () => {
  const { user } = useAuth();
  return (
    <CRMProvider key={user?.organizationId ?? "no-org"}>
      <CRMDashboard />
    </CRMProvider>
  );
};

export default Index;
