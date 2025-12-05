import { useState } from 'react';
import { CRMProvider } from '@/context/CRMContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardHeader } from '@/components/crm/DashboardHeader';
import { LeadTable } from '@/components/crm/LeadTable';
import { KanbanBoard } from '@/components/crm/KanbanBoard';
import { ConvertidosTab } from '@/components/crm/ConvertidosTab';
import { MetricasTab } from '@/components/crm/MetricasTab';
import { PendenciasTab } from '@/components/crm/PendenciasTab';
import { GamificacaoTab } from '@/components/crm/GamificacaoTab';
import { AlertaBanner } from '@/components/crm/AlertaBanner';
import { LayoutDashboard, Table, Kanban, CheckCircle, BarChart3, AlertTriangle, Trophy } from 'lucide-react';

const CRMDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">CRM de Prospecção</h1>
              <p className="text-sm text-muted-foreground">Gestão inteligente de leads</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <AlertaBanner onNavigate={setActiveTab} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
            <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-background">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="crm" className="gap-2 data-[state=active]:bg-background">
              <Table className="w-4 h-4" />
              <span className="hidden sm:inline">CRM</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2 data-[state=active]:bg-background">
              <Kanban className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </TabsTrigger>
            <TabsTrigger value="convertidos" className="gap-2 data-[state=active]:bg-background">
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Convertidos</span>
            </TabsTrigger>
            <TabsTrigger value="metricas" className="gap-2 data-[state=active]:bg-background">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Métricas</span>
            </TabsTrigger>
            <TabsTrigger value="pendencias" className="gap-2 data-[state=active]:bg-background">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Pendências</span>
            </TabsTrigger>
            <TabsTrigger value="gamificacao" className="gap-2 data-[state=active]:bg-background">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Gamificação</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardHeader />
            <LeadTable />
          </TabsContent>

          <TabsContent value="crm">
            <LeadTable />
          </TabsContent>

          <TabsContent value="kanban">
            <KanbanBoard />
          </TabsContent>

          <TabsContent value="convertidos">
            <ConvertidosTab />
          </TabsContent>

          <TabsContent value="metricas">
            <MetricasTab />
          </TabsContent>

          <TabsContent value="pendencias">
            <PendenciasTab />
          </TabsContent>

          <TabsContent value="gamificacao">
            <GamificacaoTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
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
