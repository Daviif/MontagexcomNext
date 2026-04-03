'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  User,
  Building2,
  Loader2,
  AlertTriangle,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'
import { NovaOSDialog } from '@/components/ordens-servico/nova-os-dialog'
import { DetalhesOSSheet } from '@/components/ordens-servico/detalhes-os-sheet'
import { EditarOSDialog } from '@/components/ordens-servico/editar-os-dialog'
import { ExcluirOSDialog } from '@/components/ordens-servico/excluir-os-dialog'
import { DuplicarOSDialog } from '@/components/ordens-servico/duplicar-os-dialog'
  
import type { OrdemServico } from '@/lib/types'

const statusColors: Record<string, string> = {
  agendada: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  em_andamento: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  concluido: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  cancelada: 'bg-destructive/10 text-destructive border-destructive/20',
  pendente: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
}

const statusLabels: Record<string, string> = {
  agendada: 'Agendada',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelada: 'Cancelada',
  pendente: 'Pendente',
}

const prioridadeColors: Record<string, string> = {
  baixa: 'bg-muted text-muted-foreground border-muted',
  normal: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  alta: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  urgente: 'bg-destructive/10 text-destructive border-destructive/20 font-bold',
}

export default function OrdensServicoPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  
  const [selectedOS, setSelectedOS] = useState<OrdemServico | null>(null)
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([])

  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [osParaEditar, setOsParaEditar] = useState<OrdemServico | null>(null)

  const [duplicarDialogOpen, setDuplicarDialogOpen] = useState(false)
  const [osParaDuplicar, setOsParaDuplicar] = useState<OrdemServico | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [osParaExcluir, setOsParaExcluir] = useState<OrdemServico | null>(null)

  const handleEditarClick = (os: OrdemServico) => {
    setOsParaEditar(os)
    setEditDialogOpen(true)
  }
  
  const handleDuplicarClick = (os: OrdemServico) => {
    setOsParaDuplicar(os)
    setDuplicarDialogOpen(true)
  }

  useEffect(() => {
    async function fetchOrdens() {
      try {
        setLoading(true)
        const res = await api.get('/servicos')
        const mapped = (res.data?.data ?? res.data ?? []).map((item: OrdemServico) => ({
          ...item,
           
          tipoCliente: item.tipo_cliente,
          valorTotal: (item.valor_total || 0),
          prioridade: (item.prioridade || 'baixa'),
          Loja: item.Loja
          ? {
            ...item.Loja,
            nome_fantasia: item.Loja.nome_fantasia,
          }
          : null,
          ClienteParticular: item.ClienteParticular || null
          ? {
            ...item.ClienteParticular ,
            nome: item.ClienteParticular?.nome,
          } : null,
        }))
        setOrdensServico(mapped)
      } catch (err) {
        console.error('Erro ao buscar dados:', err)
        setErro('Não foi possível carregar as ordens de serviço.')
      } finally {
        setLoading(false)
      }
    }
    fetchOrdens()
  }, [])

  const filteredOS = ordensServico.filter((os) => {
    const num = (os.codigo_os_loja || '').toLowerCase();
    
    let bairro = '';
    let cidade = '';

    if (os.endereco_execucao && typeof os.endereco_execucao === 'string') {
      const partes = os.endereco_execucao.split(',');

      bairro = (partes[1] || '').trim().toLowerCase();
      cidade = (partes[2] || '').trim().toLowerCase();
    }

    const busca = searchTerm.toLowerCase();
    const buscaNome = os?.Loja?.nome_fantasia?.toLowerCase() || '';
    const matchesSearch = num.includes(busca) || bairro.includes(busca) || cidade.includes(busca) || buscaNome.includes(busca);
    const matchesStatus = statusFilter === 'todos' || os.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
 
  // Novo: pega nome do cliente/loja do campo correto
  
  const getClienteName = (os: OrdemServico) => {
    
    if (os.tipo_cliente === 'loja') {
      return os.Loja?.nome_fantasia;
    }
    if (os.tipo_cliente === 'particular'){ 
      const p = os.ClienteParticular;
      return p?.nome;
    }  
    return 'Cliente não encontrado';
  }

  const stats = {
    total: ordensServico.length,
    agendadas: ordensServico.filter(os => os.status === 'agendada').length,
    emAndamento: ordensServico.filter(os => os.status === 'em_andamento').length,
    concluidas: ordensServico.filter(os => os.status === 'concluido').length,
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando ordens de serviço...</p>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-2">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="font-medium text-destructive">{erro}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ordens de Serviço</h1>
          <p className="text-muted-foreground">Gerenciamento completo da operação Montagex.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Nova OS
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-muted/30"><CardContent className="pt-6">
          <p className="text-xs font-medium text-muted-foreground uppercase">Total</p>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs font-medium text-blue-500 uppercase">Agendadas</p>
          <div className="text-2xl font-bold text-blue-500">{stats.agendadas}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs font-medium text-amber-500 uppercase">Em Andamento</p>
          <div className="text-2xl font-bold text-amber-500">{stats.emAndamento}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs font-medium text-emerald-500 uppercase">Concluídas</p>
          <div className="text-2xl font-bold text-emerald-500">{stats.concluidas}</div>
        </CardContent></Card>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome fantasia, número, bairro ou cidade..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-9" 
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filtrar Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            {Object.keys(statusLabels).map(key => (
              <SelectItem key={key} value={key}>{statusLabels[key]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela Principal */}
      <Card className="shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Endereço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Prioridade</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOS.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Nenhuma ordem de serviço encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredOS.map((os) => (
                <TableRow key={os.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-bold text-primary">{os.codigo_os_loja}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {os.tipo_cliente === 'loja' ? <Building2 className="h-3 w-3 opacity-50"/> : <User className="h-3 w-3 opacity-50"/>}
                      <span className="truncate max-w-[140px] font-medium">{getClienteName(os)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                    
                    {typeof os.endereco_execucao === 'string' ? os.endereco_execucao : os.endereco_execucao?.logradouro || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-[10px] uppercase font-bold', statusColors[os.status])}>
                      {statusLabels[os.status] || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className={cn('text-[10px] uppercase', prioridadeColors[os.prioridade || 'normal'])}>
                      {os.prioridade || 'normal'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold font-mono">
                    R$ {(
                      os.valor_total ??
                      0
                    ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedOS(os); setSheetOpen(true); }}>
                          <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditarClick(os)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicarClick(os)}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => { setOsParaExcluir(os); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <NovaOSDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <DetalhesOSSheet open={sheetOpen} onOpenChange={setSheetOpen} os={selectedOS} />
      {osParaEditar && (
        <EditarOSDialog 
          key={osParaEditar.id}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          ordemServico={osParaEditar}
          onSaveSuccess={() => window.location.reload()}
        />
      )}
      <ExcluirOSDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        ordemServico={osParaExcluir}
        onDeleteSuccess={() => window.location.reload()}
      />

      <DuplicarOSDialog
        open={duplicarDialogOpen}
        onOpenChange={setDuplicarDialogOpen}
        ordemServico={osParaDuplicar}
      />
    </div>
  )
}