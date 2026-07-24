import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";
import { SoWProvider, useSoW } from "@/context/SoWContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Building2,
  Wallet,
  Coins,
  CalendarClock,
  Target,
  Bell,
  Sparkles,
  History,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon,
  ArrowLeftRight,
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

import SoWDashboard from "@/components/sow/dashboard/SoWDashboard";
import ClientesView from "@/components/sow/clientes/ClientesView";
import InstituicoesView from "@/components/sow/instituicoes/InstituicoesView";
import CarteirasView from "@/components/sow/carteiras/CarteirasView";
import AtivosView from "@/components/sow/ativos/AtivosView";
import TimelineView from "@/components/sow/timeline/TimelineView";
import OportunidadesView from "@/components/sow/oportunidades/OportunidadesView";
import AlertasView from "@/components/sow/alertas/AlertasView";
import IAView from "@/components/sow/ia/IAView";
import HistoricoView from "@/components/sow/historico/HistoricoView";
import IndicadoresView from "@/components/sow/indicadores/IndicadoresView";
import ConfigView from "@/components/sow/config/ConfigView";

const SoWShell = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const { signOut, user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { setSelectedClienteId } = useSoW();
  const isAdmin = user?.role === "ADMIN";
  const isDark = resolvedTheme === "dark";

  // Tema por tenant (EQI) — mesma lógica da prospecção, para herdar o visual.
  const orgSlug = user?.organization?.slug ?? "";
  const isEqi = /eqi/i.test(orgSlug);
  useEffect(() => {
    const root = document.documentElement;
    if (isEqi) root.setAttribute("data-tenant", "eqi");
    else root.removeAttribute("data-tenant");
    return () => root.removeAttribute("data-tenant");
  }, [isEqi]);

  const roleLabel = (user?.role || "SELLER").toUpperCase();
  const initials =
    user?.name?.slice(0, 2).toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    "US";

  const navItems = useMemo(
    () =>
      [
        { key: "dashboard", label: "Dashboard SoW", icon: LayoutDashboard },
        { key: "clientes", label: "Clientes", icon: Users },
        { key: "instituicoes", label: "Instituições", icon: Building2 },
        { key: "carteiras", label: "Carteiras", icon: Wallet },
        { key: "ativos", label: "Ativos", icon: Coins },
        { key: "timeline", label: "Timeline", icon: CalendarClock },
        { key: "oportunidades", label: "Oportunidades", icon: Target },
        { key: "alertas", label: "Alertas", icon: Bell },
        { key: "ia", label: "IA", icon: Sparkles },
        { key: "historico", label: "Histórico", icon: History },
        { key: "indicadores", label: "Indicadores", icon: BarChart3 },
        ...(isAdmin ? [{ key: "config", label: "Configurações", icon: Settings }] : []),
      ],
    [isAdmin]
  );

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "Logout realizado", description: "Você foi desconectado com sucesso" });
      navigate("/login", { replace: true });
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        description: error instanceof Error ? error.message : "Erro ao fazer logout",
        variant: "destructive",
      });
    }
  };

  const goTo = (key: string) => {
    if (key !== "clientes") setSelectedClienteId(null);
    setActiveView(key);
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard": return <SoWDashboard onNavigate={goTo} />;
      case "clientes": return <ClientesView onNavigate={goTo} />;
      case "instituicoes": return <InstituicoesView />;
      case "carteiras": return <CarteirasView />;
      case "ativos": return <AtivosView />;
      case "timeline": return <TimelineView />;
      case "oportunidades": return <OportunidadesView />;
      case "alertas": return <AlertasView onNavigate={goTo} />;
      case "ia": return <IAView />;
      case "historico": return <HistoricoView />;
      case "indicadores": return <IndicadoresView />;
      case "config": return <ConfigView />;
      default: return <SoWDashboard onNavigate={goTo} />;
    }
  };

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border/60">
        <SidebarHeader className="p-4 pb-3">
          <div className="flex items-center gap-2.5 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden min-w-0">
              <p className="text-[13px] font-bold text-foreground tracking-tight leading-tight truncate">
                Share of Wallet
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {isEqi ? "EQI · Patrimônio" : "Patrimônio & Captação"}
              </p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      onClick={() => goTo(item.key)}
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

        <SidebarFooter className="p-2 border-t border-sidebar-border/50">
          {/* Cross-nav de volta à prospecção */}
          <button
            onClick={() => navigate("/")}
            className="group-data-[collapsible=icon]:hidden w-full flex items-center gap-2.5 rounded-lg px-2 py-2 mb-1 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" />
            Prospecção
          </button>

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

          <div className="hidden group-data-[collapsible=icon]:flex justify-center py-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted/60" title="Conta">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-44">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-xs font-semibold text-foreground truncate">{user?.name || user?.email}</p>
                  <p className="text-[11px] text-muted-foreground">{roleLabel}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/")} className="gap-2 text-[13px]">
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  Prospecção
                </DropdownMenuItem>
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

      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 md:px-5 h-14">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground" />
              <div>
                <h1 className="text-[15px] font-bold text-foreground tracking-tight leading-tight">
                  Share of Wallet
                </h1>
                <p className="text-[11.5px] text-muted-foreground hidden sm:block leading-tight">
                  Gestão de patrimônio e captação
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
            >
              {isDark ? <Sun className="h-[15px] w-[15px]" /> : <Moon className="h-[15px] w-[15px]" />}
            </Button>
          </div>
        </header>

        <main className="px-4 md:px-6 py-5 space-y-4 min-w-0">
          <div className="animate-fade-up">{renderView()}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

const ShareOfWallet = () => {
  const { user } = useAuth();
  return (
    <SoWProvider key={user?.organizationId ?? "no-org"}>
      <SoWShell />
    </SoWProvider>
  );
};

export default ShareOfWallet;
