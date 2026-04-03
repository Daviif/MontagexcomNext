'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Clock,
  Calendar,
  User,
  Building2,
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
  DropdownMenuLabel,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { mockOrdensServico, mockLojas, mockClientesParticulares } from '@/lib/mock-data'
import { NovaOSDialog } from '@/components/ordens-servico/nova-os-dialog'
import { DetalhesOSSheet } from '@/components/ordens-servico/detalhes-os-sheet'
import type { OrdemServico } from '@/lib/types'

const statusColors: Record<string, string> = {
  agendada: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  em_andamento: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  concluida: 'bg-primary/10 text-primary border-primary/20',
  cancelada: 'bg-destructive/10 text-destructive border-destructive/20',
  pendente: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
}

const statusLabels: Record<string, string> = {
  agendada: 'Agendada',
  em_andamento: 'Em Andamento',
  concluida: 'Concluida',
  cancelada: 'Cancelada',
  pendente: 'Pendente',
}

const prioridadeColors: Record<string, string> = {
  baixa: 'bg-muted text-muted-foreground border-muted',
  normal: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  alta: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  urgente: 'bg-destructive/10 text-destructive border-destructive/20',
}

export default function OrdensServicoPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedOS, setSelectedOS] = useState<OrdemServico | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const filteredOS = mockOrdensServico.filter((os) => {
    const matchesSearch =
      os.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.enderecoEntrega.bairro.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.enderecoEntrega.cidade.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'todos' || os.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getClienteName = (os: OrdemServico) => {
    if (os.tipoCliente === 'loja') {
      const loja = mockLojas.find(l => l.id === os.clienteId)
      return loja?.nomeFantasia || 'Loja nao encontrada'
    }
    const cliente = mockClientesParticulares.find(c => c.id === os.clienteId)
    return cliente?.nome || 'Cliente nao encontrado'
  }

  const stats = {
    total: mockOrdensServico.length,
    agendadas: mockOrdensServico.filter(os => os.status === 'agendada').length,
    emAndamento: mockOrdensServico.filter(os => os.status === 'em_andamento').length,
    concluidas: mockOrdensServico.filter(os => os.status === 'concluida').length,
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ordens de Servico</h1>
          <p className="text-muted-foreground">
            Gerencie todas as suas ordens de servico
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova OS
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Agendadas</CardTitle>
            <Clock className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{stats.agendadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{stats.emAndamento}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluidas</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.concluidas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por numero, bairro ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="agendada">Agendada</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="concluida">Concluida</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Endereco</TableHead>
                  <TableHead className="hidden lg:table-cell">Data/Horario</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Prioridade</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOS.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <p className="text-muted-foreground">Nenhuma ordem de servico encontrada</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOS.map((os) => (
                    <TableRow key={os.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{os.numero}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {os.tipoCliente === 'loja' ? (
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="truncate max-w-[150px]">{getClienteName(os)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">
                            {os.enderecoEntrega.bairro}, {os.enderecoEntrega.cidade}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {new Date(os.dataAgendada).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {os.janelaHorario.inicio} - {os.janelaHorario.fim}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs', statusColors[os.status])}>
                          {statusLabels[os.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className={cn('text-xs', prioridadeColors[os.prioridade])}>
                          {os.prioridade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {os.valorTotal.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Abrir menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedOS(os)
                              setSheetOpen(true)
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Nova OS Dialog */}
      <NovaOSDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* Detalhes OS Sheet */}
      <DetalhesOSSheet 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
        os={selectedOS}
      />
    </div>
  )
}
