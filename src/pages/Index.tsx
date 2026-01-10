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
  Users,
  Shield,
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
  const navigate = useNavigate();
  const isLeader = user?.role === "LEADER" || user?.role === "ADMIN";

  const roleLabel = (user?.role || "SELLER").toUpperCase();

  const navItems = useMemo(
    () =>
      [
        { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { key: "leads", label: "Leads", icon: Table },
        { key: "kanban", label: "Kanban", icon: Kanban },
        { key: "convertidos", label: "Convertidos", icon: CheckCircle },
        { key: "metricas", label: "Metricas", icon: BarChart3 },
        { key: "pendencias", label: "Pendencias", icon: AlertTriangle },
        { key: "gamificacao", label: "Gamificacao", icon: Trophy },
        ...(isLeader ? [{ key: "leader", label: "Lideranca", icon: Users }] : []),
      ],
    [isLeader]
  );

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Voce foi desconectado com sucesso",
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
          <div className="space-y-6">
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
      default:
        return <DashboardHeader />;
    }
  };

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border/50">
        <SidebarHeader className="gap-3 p-4 border-b border-border/50">
          <div className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:justify-center transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm transition-all duration-200 group-hover:bg-primary/20">
              <Shield className="h-5 w-5" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold text-foreground">Prospeccao Fantastica</p>
              <p className="text-xs text-muted-foreground">CRM & Performance</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    onClick={() => setActiveView(item.key)}
                    isActive={activeView === item.key}
                    tooltip={item.label}
                    className="transition-all duration-200 hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm"
                  >
                    <item.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                    <span className="group-data-[collapsible=icon]:hidden font-medium">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
        <SidebarFooter className="p-3 border-t border-border/50 group-data-[collapsible=icon]:hidden">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground shadow-sm">
            <p className="font-medium text-foreground mb-1">Atalhos</p>
            <p className="text-xs">Ctrl/Cmd + B para recolher</p>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.08),_transparent_55%),_linear-gradient(180deg,_hsl(var(--background)),_hsl(var(--muted)/0.4))]">
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 shadow-sm">
          <div className="flex items-center justify-between px-4 md:px-6 py-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden" />
              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">Central de Prospecao</h1>
                <p className="text-xs md:text-sm text-muted-foreground">Visao unificada de vendas e produtividade</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Badge 
                variant="secondary" 
                className="hidden sm:flex font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
              >
                {roleLabel}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hover:bg-muted/50 transition-colors">
                    <Avatar className="h-8 w-8 ring-2 ring-border">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {user?.name?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || "US"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">
                      {user?.name || user?.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6 min-w-0 transition-all duration-300">
          <AlertaBanner onNavigate={setActiveView} />
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
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
