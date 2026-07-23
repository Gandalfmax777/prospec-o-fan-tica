import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { SUPER_ADMIN_EMAIL } from "@/config/superAdmin";
import type { SysAdminOrg, SysAdminMember, SysAdminStats } from "@/types/api";
import type { OrgInvite } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Users,
  Mail,
  Plus,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Send,
  UserPlus,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const roleLabel: Record<string, string> = {
  SELLER: "Vendedor",
  LEADER: "Líder",
  ADMIN: "Admin",
};

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  SELLER: "outline",
  LEADER: "secondary",
  ADMIN: "default",
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
      <div className="rounded-lg bg-primary/10 p-2.5">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Org Detail Panel ──────────────────────────────────────────────────────────

function OrgDetailPanel({
  org,
  onBack,
  onOrgDeleted,
}: {
  org: SysAdminOrg;
  onBack: () => void;
  onOrgDeleted: () => void;
}) {
  const { toast } = useToast();
  const [members, setMembers] = useState<SysAdminMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState(false);
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);

  const loadOrgData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [m, i] = await Promise.all([
        api.sysadmin.getOrgMembers(org.id),
        api.sysadmin.getOrgInvites(org.id),
      ]);
      setMembers(m);
      setInvites(i);
    } catch {
      toast({ title: "Erro ao carregar dados da org", variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  }, [org.id, toast]);

  useEffect(() => {
    loadOrgData();
  }, [loadOrgData]);

  // O token do convite não é devolvido pela API — o e-mail é o único canal de
  // entrega. Reenviar cobre o caso de falha no envio.
  const handleResendInvite = async (inviteId: string) => {
    try {
      setResendingInviteId(inviteId);
      const result = await api.sysadmin.resendOrgInvite(org.id, inviteId);
      toast({ title: "Convite reenviado", description: `E-mail enviado para ${result.email}.` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao reenviar convite";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setResendingInviteId(null);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await api.sysadmin.cancelOrgInvite(org.id, inviteId);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast({ title: "Convite cancelado" });
    } catch {
      toast({ title: "Erro ao cancelar convite", variant: "destructive" });
    }
  };

  const handleDeleteOrg = async () => {
    setDeletingOrg(true);
    try {
      await api.sysadmin.deleteOrg(org.id);
      toast({ title: `Organização "${org.name}" removida.` });
      onOrgDeleted();
    } catch {
      toast({ title: "Erro ao remover organização", variant: "destructive" });
      setDeletingOrg(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{org.name}</h2>
            <p className="text-sm text-muted-foreground">
              {org.membersCount} membros · {org.leadsCount} leads · criada em{" "}
              {format(new Date(org.createdAt), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInviteDialog(true)}
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Convidar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Remover org
          </Button>
        </div>
      </div>

      {loadingData ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Membros */}
          <div className="rounded-xl border bg-card">
            <div className="px-5 py-4 border-b flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Membros ({members.length})</span>
            </div>
            <div className="divide-y">
              {members.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">
                  Nenhum membro ainda.
                </p>
              ) : (
                members.map((m) => (
                  <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{m.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <Badge variant={roleBadgeVariant[m.role] ?? "outline"} className="text-xs">
                      {roleLabel[m.role] ?? m.role}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Convites pendentes */}
          <div className="rounded-xl border bg-card">
            <div className="px-5 py-4 border-b flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Convites pendentes ({invites.length})</span>
            </div>
            <div className="divide-y">
              {invites.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">
                  Nenhum convite pendente.
                </p>
              ) : (
                invites.map((i) => (
                  <div key={i.id} className="px-5 py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{i.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {roleLabel[i.role] ?? i.role} · expira{" "}
                        {format(new Date(i.expiresAt), "dd/MM", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Reenviar e-mail de convite"
                        disabled={resendingInviteId === i.id}
                        onClick={() => handleResendInvite(i.id)}
                      >
                        {resendingInviteId === i.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        title="Cancelar convite"
                        onClick={() => handleCancelInvite(i.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Convidar */}
      <InviteDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        orgId={org.id}
        orgName={org.name}
        onInvited={(newInvite) => setInvites((prev) => [newInvite, ...prev])}
      />

      {/* Alert: Confirmar remoção da org */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover "{org.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os dados da organização (membros, leads, históricos) serão
              permanentemente apagados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingOrg}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteOrg}
              disabled={deletingOrg}
            >
              {deletingOrg ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Invite Dialog ─────────────────────────────────────────────────────────────

function InviteDialog({
  open,
  onOpenChange,
  orgId,
  orgName,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orgId: string;
  orgName: string;
  onInvited: (invite: OrgInvite) => void;
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("SELLER");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const invite = await api.sysadmin.createOrgInvite(orgId, email.trim(), role);
      onInvited(invite);
      if (invite.emailSent === false) {
        toast({
          title: "Convite criado — e-mail não enviado",
          description: `Não foi possível enviar o e-mail para ${email}. Verifique a configuração de envio e use "Reenviar" na lista de convites.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Convite enviado!",
          description: `E-mail de convite enviado para ${email} em ${orgName}.`,
        });
      }
      setEmail("");
      setRole("SELLER");
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar convite";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar para "{orgName}"</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">E-mail</label>
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Função</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SELLER">Vendedor</SelectItem>
                <SelectItem value="LEADER">Líder</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enviar convite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Org Dialog ─────────────────────────────────────────────────────────

function CreateOrgDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (org: SysAdminOrg) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const org = await api.sysadmin.createOrg(name.trim());
      onCreated(org);
      toast({ title: "Organização criada!", description: org.name });
      setName("");
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao criar organização";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova organização</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Nome da organização</label>
            <Input
              placeholder="Ex: Imobiliária Alfa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SysAdmin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stats, setStats] = useState<SysAdminStats | null>(null);
  const [orgs, setOrgs] = useState<SysAdminOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<SysAdminOrg | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"orgs" | "users">("orgs");
  const [users, setUsers] = useState<import("@/types/api").SysAdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Guard: só o superadmin acessa
  useEffect(() => {
    if (!authLoading && user && user.email !== SUPER_ADMIN_EMAIL) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, o] = await Promise.all([
        api.sysadmin.getStats(),
        api.sysadmin.getOrgs(),
      ]);
      setStats(s);
      setOrgs(o);
    } catch {
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const u = await api.sysadmin.getUsers();
      setUsers(u);
    } catch {
      toast({ title: "Erro ao carregar usuários", variant: "destructive" });
    } finally {
      setLoadingUsers(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user?.email === SUPER_ADMIN_EMAIL) loadData();
  }, [user, loadData]);

  useEffect(() => {
    if (activeTab === "users" && users.length === 0) loadUsers();
  }, [activeTab, loadUsers, users.length]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user.email !== SUPER_ADMIN_EMAIL) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Painel do Sistema</h1>
            <p className="text-xs text-muted-foreground">Administração global · {user.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={loadData} title="Recarregar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={Building2} label="Organizações" value={stats.orgCount} />
            <StatCard icon={Users} label="Usuários" value={stats.userCount} />
            <StatCard icon={Mail} label="Convites pendentes" value={stats.pendingInvites} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "orgs"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => { setActiveTab("orgs"); setSelectedOrg(null); }}
          >
            <Building2 className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Organizações
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "users"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("users")}
          >
            <BarChart3 className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Usuários
          </button>
        </div>

        {/* Tab: Organizações */}
        {activeTab === "orgs" && (
          <>
            {selectedOrg ? (
              <OrgDetailPanel
                org={selectedOrg}
                onBack={() => setSelectedOrg(null)}
                onOrgDeleted={() => {
                  setOrgs((prev) => prev.filter((o) => o.id !== selectedOrg.id));
                  setSelectedOrg(null);
                  loadData();
                }}
              />
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {orgs.length} organização{orgs.length !== 1 ? "ões" : ""} cadastrada{orgs.length !== 1 ? "s" : ""}
                  </p>
                  <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Nova organização
                  </Button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : orgs.length === 0 ? (
                  <div className="rounded-xl border bg-card p-12 text-center">
                    <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">Nenhuma organização ainda</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Crie a primeira organização para começar.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border bg-card divide-y overflow-hidden">
                    {orgs.map((org) => (
                      <button
                        key={org.id}
                        className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/40 transition-colors text-left"
                        onClick={() => setSelectedOrg(org)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{org.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {org.membersCount} membros · {org.leadsCount} leads
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            criada em {format(new Date(org.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Tab: Usuários */}
        {activeTab === "users" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {users.length} usuário{users.length !== 1 ? "s" : ""} cadastrado{users.length !== 1 ? "s" : ""}
              </p>
              <Button variant="ghost" size="sm" onClick={loadUsers}>
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Recarregar
              </Button>
            </div>

            {loadingUsers ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-xl border bg-card divide-y overflow-hidden">
                {users.map((u) => (
                  <div key={u.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{u.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                      {u.organizationName && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {u.organizationName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {u.leadsCount} lead{u.leadsCount !== 1 ? "s" : ""}
                      </span>
                      <Badge variant={roleBadgeVariant[u.role] ?? "outline"} className="text-xs">
                        {roleLabel[u.role] ?? u.role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <CreateOrgDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={(org) => {
          setOrgs((prev) => [org, ...prev]);
          setStats((prev) => prev ? { ...prev, orgCount: prev.orgCount + 1 } : prev);
        }}
      />
    </div>
  );
}
