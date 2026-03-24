import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const roleColors: Record<string, string> = {
  ADMIN: "bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.3)]",
  LEADER: "bg-[hsl(38_92%_50%/0.1)] text-[hsl(38_92%_46%)] border-[hsl(38_92%_50%/0.3)]",
  SELLER: "bg-muted text-muted-foreground border-border",
};

const CRMDashboard = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const isLeader = user?.role === "LEADER" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  const roleLabel = (user?.role || "SELLER").toUpperCase();

  const navItems = useMemo(
    () =>
      [
        { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { key: "leads", label: "Leads", icon: Table },
        { key: "kanban", label: "Kanban", icon: Kanban },
        { key: "convertidos", label: "Convertidos", icon: CheckCircle },
        { key: "metricas", label: "Métricas", icon: BarChart3 },
        { key: "pendencias", label: "Pendências", icon: AlertTriangle },
        { key: "gamificacao", label: "Gamificação", icon: Trophy },
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
    if (activeView === "leader" && !isLeader) {
      return <DashboardHeader />;
    }

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
      case "leads":
        return <LeadTable />;
      case "kanban":
        return <KanbanBoard />;
      case "convertidos":
        return <ConvertidosTab />;
      case "metricas":
        return <MetricasTab />;
      case "pendencias":
        return <PendenciasTab />;
      case "gamificacao":
        return <GamificacaoTab />;
      case "leader":
        return <LeaderDashboard onSellerClick={handleSellerClick} />;
      case "settings":
        return <CrmIntegrationSettings />;
      default:
        return <DashboardHeader />;
    }
  };

  return (
    <SidebarProvider>
      {/* ── Sidebar ── */}
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border/60">
        <SidebarHeader className="p-4 pb-3">
          <div className="flex items-center gap-2.5 px-1 group-data-[collapsible=icon]:justify-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <img src="/shield.svg" className="h-4 w-4 opacity-90" alt="Logo" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden min-w-0">
              <p
                className="text-[13px] font-bold text-foreground tracking-tight leading-tight truncate"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                Prospecção
              </p>
              <p className="text-[11px] text-muted-foreground truncate">CRM & Performance</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 pt-1">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      onClick={() => setActiveView(item.key)}
                      isActive={activeView === item.key}
                      tooltip={item.label}
                      className="h-9 rounded-md text-[13px] font-medium transition-all duration-150 hover:bg-primary/8 hover:text-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                    >
                      <item.icon className="h-[15px] w-[15px]" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Sidebar footer — user info */}
        <SidebarFooter className="p-3 border-t border-sidebar-border/50 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2.5">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
                {user?.name?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || "US"}
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
              title="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* ── Main content ── */}
      <SidebarInset className="bg-background">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 md:px-6 h-14">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden h-8 w-8" />
              <div>
                <h1
                  className="text-[15px] font-bold text-foreground tracking-tight leading-tight"
                  style={{ fontFamily: "Syne, sans-serif" }}
                >
                  Central de Prospecção
                </h1>
                <p className="text-[11.5px] text-muted-foreground hidden sm:block">
                  Visão unificada de vendas e produtividade
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`hidden sm:flex text-[11px] font-semibold px-2 py-0.5 ${roleColors[roleLabel] ?? roleColors["SELLER"]}`}
              >
                {roleLabel}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted/60">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
                        {user?.name?.slice(0, 2).toUpperCase() ||
                          user?.email?.slice(0, 2).toUpperCase() ||
                          "US"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
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
  return (
    <CRMProvider>
      <CRMDashboard />
    </CRMProvider>
  );
};

export default Index;
