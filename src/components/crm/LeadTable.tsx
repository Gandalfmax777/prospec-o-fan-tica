import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCRM } from '@/context/CRMContext';
import { Lead, Cadencia, Temperatura, Origem } from '@/types/crm';
import { StatusBadge, TemperaturaBadge, PrioridadeBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { CalendarIcon, Phone, Edit, Trash2, History, Plus, CheckCircle, MessageSquare } from 'lucide-react';
import { BriefingDialog } from './BriefingDialog';
import { HistoricoDialog } from './HistoricoDialog';

export const LeadTable = () => {
  const { leads, updateLead, deleteLead, registrarContato, addLead } = useCRM();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [newLead, setNewLead] = useState({
    nome: '',
    cidade: '',
    origem: 'Instagram' as Origem,
    telefone: '',
    codigo: '',
    cadencia: 'Semanal' as Cadencia,
    ultimoContato: null as Date | null,
    temperatura: 'Frio' as Temperatura,
    observacao: '',
    dataEntrada: new Date(),
    dataConversao: null as Date | null,
  });

  const activeLeads = leads.filter(l => l.status !== 'Convertido');

  const handleAddLead = () => {
    addLead(newLead);
    setShowAddDialog(false);
    setNewLead({
      nome: '',
      cidade: '',
      origem: 'Instagram',
      telefone: '',
      codigo: '',
      cadencia: 'Semanal',
      ultimoContato: null,
      temperatura: 'Frio',
      observacao: '',
      dataEntrada: new Date(),
      dataConversao: null,
    });
  };

  const handleRegistrarContatoHoje = (lead: Lead) => {
    registrarContato(lead.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Leads Ativos</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Lead</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={newLead.nome}
                  onChange={e => setNewLead({ ...newLead, nome: e.target.value })}
                  placeholder="Nome do lead"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cidade</label>
                <Input
                  value={newLead.cidade}
                  onChange={e => setNewLead({ ...newLead, cidade: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Origem</label>
                <Select value={newLead.origem} onValueChange={(v: Origem) => setNewLead({ ...newLead, origem: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Instagram', 'Indicação', 'Anúncio', 'Evento', 'WhatsApp', 'Orgânico', 'LinkedIn', 'Site', 'Outro'].map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <Input
                  value={newLead.telefone}
                  onChange={e => setNewLead({ ...newLead, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Código</label>
                <Input
                  value={newLead.codigo}
                  onChange={e => setNewLead({ ...newLead, codigo: e.target.value })}
                  placeholder="Código do lead"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cadência</label>
                <Select value={newLead.cadencia} onValueChange={(v: Cadencia) => setNewLead({ ...newLead, cadencia: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semanal">Semanal</SelectItem>
                    <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Temperatura</label>
                <Select value={newLead.temperatura} onValueChange={(v: Temperatura) => setNewLead({ ...newLead, temperatura: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Frio">❄️ Frio</SelectItem>
                    <SelectItem value="Morno">🌤️ Morno</SelectItem>
                    <SelectItem value="Quente">🔥 Quente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Último Contato</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !newLead.ultimoContato && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newLead.ultimoContato ? format(newLead.ultimoContato, 'PPP', { locale: ptBR }) : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newLead.ultimoContato || undefined}
                      onSelect={(date) => setNewLead({ ...newLead, ultimoContato: date || null })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Observação</label>
                <Input
                  value={newLead.observacao}
                  onChange={e => setNewLead({ ...newLead, observacao: e.target.value })}
                  placeholder="Observações sobre o lead"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
              <Button onClick={handleAddLead}>Adicionar Lead</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Prioridade</TableHead>
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="font-semibold">Cidade</TableHead>
                <TableHead className="font-semibold">Origem</TableHead>
                <TableHead className="font-semibold">Telefone</TableHead>
                <TableHead className="font-semibold">Código</TableHead>
                <TableHead className="font-semibold">Cadência</TableHead>
                <TableHead className="font-semibold">Último Contato</TableHead>
                <TableHead className="font-semibold">Próximo Contato</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Temperatura</TableHead>
                <TableHead className="font-semibold">Score</TableHead>
                <TableHead className="font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeLeads.sort((a, b) => b.score - a.score).map(lead => (
                <TableRow key={lead.id} className="hover:bg-muted/30">
                  <TableCell>
                    <PrioridadeBadge prioridade={lead.prioridade} />
                  </TableCell>
                  <TableCell className="font-medium">{lead.nome}</TableCell>
                  <TableCell>{lead.cidade}</TableCell>
                  <TableCell>
                    <span className="metric-badge bg-muted text-muted-foreground">{lead.origem}</span>
                  </TableCell>
                  <TableCell>
                    <a href={`tel:${lead.telefone}`} className="flex items-center gap-1 text-primary hover:underline">
                      <Phone className="w-3 h-3" />
                      {lead.telefone}
                    </a>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{lead.codigo}</TableCell>
                  <TableCell>
                    <Select
                      value={lead.cadencia}
                      onValueChange={(v: Cadencia) => updateLead(lead.id, { cadencia: v })}
                    >
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Semanal">Semanal</SelectItem>
                        <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                        <SelectItem value="Mensal">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn('w-[130px] justify-start text-left font-normal', !lead.ultimoContato && 'text-muted-foreground')}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {lead.ultimoContato ? format(lead.ultimoContato, 'dd/MM/yyyy') : 'Selecione'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={lead.ultimoContato || undefined}
                          onSelect={(date) => updateLead(lead.id, { ultimoContato: date || null })}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell>
                    {lead.proximoContato ? (
                      <span className={cn(
                        'font-medium',
                        lead.status === 'Atrasado' && 'text-[hsl(var(--status-atrasado))]',
                        lead.status === 'Falar Hoje' && 'text-[hsl(var(--status-falar-hoje))]'
                      )}>
                        {format(lead.proximoContato, 'dd/MM/yyyy')}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={lead.status} />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lead.temperatura}
                      onValueChange={(v: Temperatura) => updateLead(lead.id, { temperatura: v })}
                    >
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Frio">❄️ Frio</SelectItem>
                        <SelectItem value="Morno">🌤️ Morno</SelectItem>
                        <SelectItem value="Quente">🔥 Quente</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-primary">{lead.score}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[hsl(var(--status-em-dia))]"
                        onClick={() => handleRegistrarContatoHoje(lead)}
                        title="Registrar contato hoje"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowBriefing(true);
                        }}
                        title="Adicionar briefing"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowHistorico(true);
                        }}
                        title="Ver histórico"
                      >
                        <History className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteLead(lead.id)}
                        title="Excluir lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedLead && (
        <>
          <BriefingDialog
            open={showBriefing}
            onOpenChange={setShowBriefing}
            lead={selectedLead}
          />
          <HistoricoDialog
            open={showHistorico}
            onOpenChange={setShowHistorico}
            lead={selectedLead}
          />
        </>
      )}
    </div>
  );
};
