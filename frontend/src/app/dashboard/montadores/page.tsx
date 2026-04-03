'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  Percent,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { NovoMontadorDialog } from '@/components/montadores/novo-montador-dialog'
import { DetalhesMontadorDialog } from '@/components/montadores/detalhes-montador-dialog'
import { EditarMontadorDialog } from '@/components/montadores/editar-montador-dialog'
import { ExcluirMontadorDialog } from '@/components/montadores/excluir-montador-dialog'
import { Montador, Usuario } from '@/lib/types'
import { api } from '@/services/api'

export default function MontadoresPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [montadores, setMontadores] = useState<Montador[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [isNovoDialogOpen, setIsNovoDialogOpen] = useState(false)
  const [detalhesDialogOpen, setDetalhesDialogOpen] = useState(false)
  const [editarDialogOpen, setEditarDialogOpen] = useState(false)
  const [montadorSelecionado, setMontadorSelecionado] = useState<Montador | null>(null)
  const [excluirDialogOpen, setExcluirDialogOpen] = useState(false)

    async function fetchMontadores() {
      try {
        
        setLoading(true)
        const res = await api.get('/usuarios')
        const todosUsuarios = res.data?.data ?? res.data ?? []
        const apenasMontadores = todosUsuarios.filter((u: Usuario) => 
        u.tipo === 'montador'
      )
        console.log('Buscando montadores...', apenasMontadores)
        setMontadores(apenasMontadores)
      } catch(err){
        console.error('Erro ao buscar dados:', err)
        setErro('Não foi possível carregar os montadores.')
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    fetchMontadores()
  }, [])

  const filteredMontadores = montadores.filter((m) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      m.nome.toLowerCase().includes(searchLower) ||
      m.email.toLowerCase().includes(searchLower) ||
      String(m.Telefone).includes(searchLower)
    )
  })

  const stats = {
    total: montadores.length,
    ativos: montadores.filter(m => m.ativo).length,
    inativos: montadores.filter(m => !m.ativo).length,
  }

  function handleVerDetalhes(montador: Montador) {
    setMontadorSelecionado(montador)
    setDetalhesDialogOpen(true)
  }

  function handleEditar(montador: Montador) {
    setMontadorSelecionado(montador)
    setEditarDialogOpen(true)
  }

  function handleExcluir(montador: Montador){
    setMontadorSelecionado(montador)
    setExcluirDialogOpen(true)
  }
  // Simular ganhos do mes para cada montador

  if (loading) {
      return (
        <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando montadores...</p>
        </div>
      )
    }
  
    if (erro) {
      return (
        <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-2">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="font-medium text-destructive">{erro}</p>
          <Button variant="outline" onClick={() => fetchMontadores()}>Tentar Novamente</Button>
        </div>
      )
    }
  

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Montadores</h1>
          <p className="text-muted-foreground">
            Gerencie sua equipe de montadores
          </p>
        </div>
        <Button onClick={() => setIsNovoDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Montador
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.ativos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inativos</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.inativos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Montador</TableHead>
                  <TableHead className="hidden md:table-cell">Contato</TableHead>
                  <TableHead>Percentual</TableHead>
                  <TableHead className="hidden lg:table-cell">Meta Mensal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMontadores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <p className="text-muted-foreground">Nenhum montador encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMontadores.map((montador) => {
                    const ganho = 0
                    const progressoMeta = (ganho / (montador.meta_mensal || 1)) * 100

                    return (
                      <TableRow key={montador.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className={cn(
                                montador.ativo
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-muted text-muted-foreground'
                              )}>
                                {montador.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{montador.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                Desde {new Date(montador.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col gap-1">
                            <p className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {montador.Telefone}
                            </p>
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {montador.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Percent className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{montador.percentual_salario}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex flex-col gap-1 w-32">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                R$ {ganho.toLocaleString('pt-BR')}
                              </span>
                              <span className="text-muted-foreground">
                                R$ {montador.meta_mensal}
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(progressoMeta, 100)} 
                              className="h-2"
                            />
                            <span className="text-xs text-right text-muted-foreground">
                              {progressoMeta.toFixed(0)}% da meta
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              montador.ativo
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : 'bg-muted text-muted-foreground border-muted'
                            )}
                          >
                            {montador.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
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
                              <DropdownMenuItem onClick={() => handleVerDetalhes(montador)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditar(montador)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleExcluir(montador)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <NovoMontadorDialog 
        open={isNovoDialogOpen} 
        onOpenChange={setIsNovoDialogOpen}
        onSuccess={fetchMontadores} // Função opcional para recarregar a lista
      />
      <DetalhesMontadorDialog
        open={detalhesDialogOpen}
        onOpenChange={setDetalhesDialogOpen}
        montador={montadorSelecionado}
      />
      <EditarMontadorDialog
        open={editarDialogOpen}
        onOpenChange={setEditarDialogOpen}
        montador={montadorSelecionado}
        onSuccess={fetchMontadores}
      />
      <ExcluirMontadorDialog
        open={excluirDialogOpen}
        onOpenChange={setExcluirDialogOpen}
        montador={montadorSelecionado}
        onDeleteSuccess={fetchMontadores}
      />
    </div>
  )
}
