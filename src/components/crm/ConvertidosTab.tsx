import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCRM } from '@/context/CRMContext';
import { Lead, Cadencia, Origem } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KPICard } from './KPICard';
import { Edit, Trash2, RotateCcw, Save, X, CheckCircle, TrendingUp, MapPin } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const ConvertidosTab = () => {
  const { leads, updateLead, deleteLead, retornarAoFunil } = useCRM();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Lead>>({});

  const convertidos = leads.filter(l => l.status === 'Convertido');

  const conversaoPorCadencia = ['Semanal', 'Quinzenal', 'Mensal'].map(c => ({
    cadencia: c,
    quantidade: convertidos.filter(l => l.cadencia === c).length,
  }));

  const conversaoPorCidade = convertidos.reduce((acc, lead) => {
    const existing = acc.find(c => c.cidade === lead.cidade);
    if (existing) {
      existing.quantidade++;
    } else {
      acc.push({ cidade: lead.cidade, quantidade: 1 });
    }
    return acc;
  }, [] as { cidade: string; quantidade: number }[]).sort((a, b) => b.quantidade - a.quantidade).slice(0, 6);

  const handleEdit = (lead: Lead) => {
    setEditingId(lead.id);
    setEditData(lead);
  };

  const handleSave = async () => {
    if (editingId && editData) {
      try {
        await updateLead(editingId, editData);
        setEditingId(null);
        setEditData({});
      } catch (err) {
        console.error('Erro ao atualizar lead:', err);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Leads Convertidos</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Total Convertidos"
          value={convertidos.length}
          icon={CheckCircle}
          variant="success"
        />
        <KPICard
          title="Taxa de Conversão"
          value={`${leads.length > 0 ? ((convertidos.length / leads.length) * 100).toFixed(1) : 0}%`}
          icon={TrendingUp}
          variant="primary"
        />
        <KPICard
          title="Cidades Atendidas"
          value={new Set(convertidos.map(l => l.cidade)).size}
          icon={MapPin}
          variant="default"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold mb-4">Conversão por Cadência</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={conversaoPorCadencia}
                dataKey="quantidade"
                nameKey="cadencia"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ cadencia, quantidade }) => `${cadencia}: ${quantidade}`}
              >
                {conversaoPorCadencia.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold mb-4">Conversão por Cidade</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={conversaoPorCidade}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="cidade" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nome</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Cadência</TableHead>
                <TableHead>Último Contato</TableHead>
                <TableHead>Data Conversão</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {convertidos.map(lead => (
                <TableRow key={lead.id}>
                  <TableCell>
                    {editingId === lead.id ? (
                      <Input
                        value={editData.nome || ''}
                        onChange={e => setEditData({ ...editData, nome: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <span className="font-medium">{lead.nome}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === lead.id ? (
                      <Input
                        value={editData.cidade || ''}
                        onChange={e => setEditData({ ...editData, cidade: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      lead.cidade
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === lead.id ? (
                      <Select
                        value={editData.origem}
                        onValueChange={(v: Origem) => setEditData({ ...editData, origem: v })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['Instagram', 'Indicação', 'Anúncio', 'Evento', 'WhatsApp', 'Orgânico', 'LinkedIn', 'Site', 'Outro'].map(o => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="metric-badge bg-muted text-muted-foreground">{lead.origem}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === lead.id ? (
                      <Input
                        value={editData.telefone || ''}
                        onChange={e => setEditData({ ...editData, telefone: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      lead.telefone
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{lead.codigo}</TableCell>
                  <TableCell>
                    {editingId === lead.id ? (
                      <Select
                        value={editData.cadencia}
                        onValueChange={(v: Cadencia) => setEditData({ ...editData, cadencia: v })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Semanal">Semanal</SelectItem>
                          <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                          <SelectItem value="Mensal">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      lead.cadencia
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.ultimoContato ? format(lead.ultimoContato, 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    {lead.dataConversao ? format(lead.dataConversao, 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    {editingId === lead.id ? (
                      <Input
                        value={editData.observacao || ''}
                        onChange={e => setEditData({ ...editData, observacao: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground line-clamp-1">{lead.observacao || '-'}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {editingId === lead.id ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(var(--status-em-dia))]" onClick={handleSave}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancel}>
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(lead)} title="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary" 
                            onClick={async () => {
                              try {
                                await retornarAoFunil(lead.id);
                              } catch (err) {
                                console.error('Erro ao retornar ao funil:', err);
                              }
                            }} 
                            title="Retornar ao Funil"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive" 
                            onClick={async () => {
                              try {
                                await deleteLead(lead.id);
                              } catch (err) {
                                console.error('Erro ao deletar lead:', err);
                              }
                            }} 
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {convertidos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Nenhum lead convertido ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
