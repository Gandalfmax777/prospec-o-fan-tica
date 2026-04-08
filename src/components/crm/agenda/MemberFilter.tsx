import { useState } from "react";
import { Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { TeamMember } from "@/types/crm";

// Cores dos membros — mesmo sistema do CRM
export const MEMBER_COLORS = [
  { bg: "bg-slate-900/10 border-slate-900/30 dark:bg-slate-400/15 dark:border-slate-400/30", dot: "bg-slate-700 dark:bg-slate-400" },
  { bg: "bg-blue-600/15 border-blue-600/30", dot: "bg-blue-600" },
  { bg: "bg-emerald-600/15 border-emerald-600/30", dot: "bg-emerald-600" },
  { bg: "bg-amber-600/15 border-amber-600/30", dot: "bg-amber-600" },
  { bg: "bg-rose-600/15 border-rose-600/30", dot: "bg-rose-600" },
  { bg: "bg-cyan-600/15 border-cyan-600/30", dot: "bg-cyan-600" },
] as const;

export interface MemberColorEntry {
  bg: string;
  dot: string;
}

export function buildMemberColorMap(
  members: TeamMember[],
  selectedIds: string[]
): Map<string, MemberColorEntry> {
  const map = new Map<string, MemberColorEntry>();
  const selected = members.filter((m) => selectedIds.includes(m.userId));
  selected.forEach((m, i) => {
    const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
    map.set(m.userId, { bg: color.bg, dot: color.dot });
  });
  return map;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

interface MemberListProps {
  members: TeamMember[];
  selectedIds: string[];
  onToggle: (userId: string) => void;
}

function MemberList({ members, selectedIds, onToggle }: MemberListProps) {
  const [search, setSearch] = useState("");
  const filtered = members.filter(
    (m) =>
      !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedMembers = members.filter((m) => selectedIds.includes(m.userId));

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar membro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>

      <div className="space-y-1 max-h-60 overflow-y-auto">
        {filtered.map((member) => {
          const checked = selectedIds.includes(member.userId);
          const colorIdx = selectedMembers.findIndex(
            (m) => m.userId === member.userId
          );
          const color =
            colorIdx >= 0
              ? MEMBER_COLORS[colorIdx % MEMBER_COLORS.length]
              : null;

          return (
            <label
              key={member.userId}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer text-sm"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => onToggle(member.userId)}
                className="h-3.5 w-3.5"
              />
              {color && (
                <span
                  className={`h-2.5 w-2.5 rounded-full shrink-0 ${color.dot}`}
                />
              )}
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarFallback className="text-[9px] font-medium bg-muted">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-xs">{member.name || member.email}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

interface MemberFilterProps {
  members: TeamMember[];
  selectedIds: string[];
  onToggle: (userId: string) => void;
  isMobile?: boolean;
}

export function MemberFilter({
  members,
  selectedIds,
  onToggle,
  isMobile,
}: MemberFilterProps) {
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Equipe
            {selectedIds.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 rounded-full">
                {selectedIds.length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>Membros do time</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <MemberList
              members={members}
              selectedIds={selectedIds}
              onToggle={onToggle}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Equipe
          {selectedIds.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 rounded-full">
              {selectedIds.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <MemberList
          members={members}
          selectedIds={selectedIds}
          onToggle={onToggle}
        />
      </PopoverContent>
    </Popover>
  );
}
