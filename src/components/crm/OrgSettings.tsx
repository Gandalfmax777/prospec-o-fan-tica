import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import type { OrgDetails, OrgInvite, OrgMember } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2,
  Check,
  ClipboardCopy,
  Loader2,
  MailPlus,
  Pencil,
  Shield,
  Trash2,
  UserMinus,
  Users,
  X,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  LEADER: "Líder",
  SELLER: "Vendedor",
};

const ROLE_BADGE_CLASS: Record<string, string> = {
  ADMIN: "bg-primary/10 text-primary border-primary/20",
  LEADER: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800/50",
  SELLER: "bg-muted text-muted-foreground border-border/50",
};

export const OrgSettings = () => {
  const { user, refreshSession } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [org, setOrg] = useState<OrgDetails | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingName, setEditingName] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState<OrgMember | null>(null);
  const [removing, setRemoving] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("SELLER");
  const [creatingInvite, setCreatingInvite] = useState(false);

  const [cancelingInviteId, setCancelingInviteId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [orgData, membersData, invitesData] = await Promise.all([
        api.getOrg(),
        api.getOrgMembers(),
        isAdmin ? api.getOrgInvites() : Promise.resolve([] as OrgInvite[]),
      ]);
      setOrg(orgData);
      setMembers(membersData);
      setInvites(invitesData);
      setNewOrgName(orgData.name);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar dados da organização";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRenameOrg = async () => {
    if (!newOrgName.trim() || newOrgName.trim().length < 2) {
      toast({ title: "Nome inválido", description: "O nome deve ter pelo menos 2 caracteres.", variant: "destructive" });
      return;
    }
    try {
      setSavingName(true);
      await api.renameOrg(newOrgName.trim());
      setOrg((prev) => prev ? { ...prev, name: newOrgName.trim() } : prev);
      setEditingName(false);
      await refreshSession();
      toast({ title: "Nome atualizado", description: "O nome da organização foi alterado com sucesso." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao renomear organização";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setSavingName(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      setRemoving(true);
      await api.removeOrgMember(memberToRemove.id);
      setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id));
      toast({ title: "Membro removido", description: `${memberToRemove.name || memberToRemove.email} foi removido da organização.` });
      setMemberToRemove(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao remover membro";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setRemoving(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast({ title: "E-mail inválido", variant: "destructive" });
      return;
    }
    try {
      setCreatingInvite(true);
      const invite = await api.createOrgInvite({ email: inviteEmail.trim(), role: inviteRole });
      setInvites((prev) => [invite, ...prev]);
      setInviteEmail("");
      toast({ title: "Convite criado!", description: `Convite enviado para ${invite.email}.` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar convite";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleCancelInvite = async (id: string) => {
    try {
      setCancelingInviteId(id);
      await api.cancelOrgInvite(id);
      setInvites((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Convite cancelado" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao cancelar convite";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setCancelingInviteId(null);
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Informações da organização ── */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40 bg-muted/20 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-foreground">Informações</p>
        </div>
        <div className="p-5 space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Nome da organização
            </Label>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  disabled={savingName}
                  className="flex-1 h-9 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameOrg();
                    if (e.key === "Escape") { setEditingName(false); setNewOrgName(org?.name ?? ""); }
                  }}
                />
                <Button size="icon" variant="ghost" onClick={handleRenameOrg} disabled={savingName} className="h-9 w-9 text-primary hover:text-primary hover:bg-primary/10">
                  {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => { setEditingName(false); setNewOrgName(org?.name ?? ""); }} className="h-9 w-9">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span className="text-sm font-medium text-foreground">{org?.name}</span>
                {isAdmin && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingName(true)}
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Membros", value: org?.membersCount ?? members.length },
              { label: "Leads", value: org?.leadsCount ?? "—" },
              { label: "Slug", value: org?.slug, mono: true },
            ].map(({ label, value, mono }) => (
              <div key={label} className="rounded-lg bg-muted/40 border border-border/40 px-3 py-2.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className={`text-sm font-semibold text-foreground mt-0.5 truncate ${mono ? "font-mono text-xs" : ""}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Membros ── */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Membros</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {members.length} membro{members.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="divide-y divide-border/40">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase">
                  {(member.name ?? member.email).slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.name || "—"}
                    {member.id === user?.id && (
                      <span className="ml-2 text-[11px] font-normal text-muted-foreground italic">você</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary" className={`text-[11px] h-5 px-2 ${ROLE_BADGE_CLASS[member.role] ?? ""}`}>
                  {ROLE_LABELS[member.role] ?? member.role}
                </Badge>
                {isAdmin && member.id !== user?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => setMemberToRemove(member)}
                    title="Remover membro"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Convites (somente ADMIN) ── */}
      {isAdmin && (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-2">
              <MailPlus className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Convidar membro</p>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 pl-6">
              O link de convite expira em 7 dias.
            </p>
          </div>
          <div className="p-5 space-y-4">
            {/* Formulário */}
            <form onSubmit={handleCreateInvite} className="flex flex-col sm:flex-row gap-2.5">
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={creatingInvite}
                className="flex-1 h-9 text-sm"
              />
              <Select value={inviteRole} onValueChange={setInviteRole} disabled={creatingInvite}>
                <SelectTrigger className="w-full sm:w-32 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SELLER">Vendedor</SelectItem>
                  <SelectItem value="LEADER">Líder</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={creatingInvite} size="sm" className="gap-2 h-9 px-4 shrink-0">
                {creatingInvite ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MailPlus className="h-3.5 w-3.5" />}
                {creatingInvite ? "Gerando..." : "Convidar"}
              </Button>
            </form>

            {/* Convites pendentes */}
            {invites.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Pendentes ({invites.length})
                </p>
                <div className="rounded-lg border border-border/50 divide-y divide-border/40 overflow-hidden">
                  {invites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between px-4 py-2.5 gap-3 hover:bg-muted/20 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{invite.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className={`text-[11px] h-4 px-1.5 ${ROLE_BADGE_CLASS[invite.role] ?? ""}`}>
                            {ROLE_LABELS[invite.role] ?? invite.role}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            expira {format(new Date(invite.expiresAt), "dd/MM", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => handleCopyToken(invite.token)}
                          title="Copiar token"
                        >
                          {copiedToken === invite.token ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <ClipboardCopy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={() => handleCancelInvite(invite.id)}
                          disabled={cancelingInviteId === invite.id}
                          title="Cancelar convite"
                        >
                          {cancelingInviteId === invite.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invites.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Nenhum convite pendente.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Aviso para não-admin ── */}
      {!isAdmin && (
        <div className="rounded-xl border border-border/60 bg-muted/20 px-5 py-4 flex items-center gap-3">
          <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            Apenas administradores podem gerenciar membros e convites.
          </p>
        </div>
      )}

      {/* ── Dialog confirmar remoção ── */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{" "}
              <strong>{memberToRemove?.name || memberToRemove?.email}</strong> da organização?
              Ele perderá o acesso ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {removing && <Loader2 className="h-4 w-4 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
