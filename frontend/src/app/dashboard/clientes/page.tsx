'use client'

import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  User,
  Phone,
  MapPin,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { NovoClienteDialog } from '@/components/clientes/novo-cliente-dialog'
import { clientes_particulares } from '@/lib/types'

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [clientes, setClientes] = useState<clientes_particulares[]>([])
  const [servicosRealizados, setServicosRealizados] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const fetchClientes = async () => {
    try {
        setLoading(true)
        
        const res = await api.get('/clientes_particulares')
        
        const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
        setClientes(data)
        console.log('Clientes carregados:', data)
      } catch (err) {
        console.error('Erro ao buscar dados:', err)
        setErro('Não foi possível carregar os clientes particulares.')
      } finally {
        setLoading(false)
      }
  }

  const fetchServicos = async () => {
    try {
      const res = await api.get('/servicos')
      // Supondo que retorna um array de serviços
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setServicosRealizados(data.length)
    } catch (err) {
      console.error('Erro ao buscar serviços:', err)
      // Não altera a UI se falhar
    }
  }

  useEffect(() => {
    fetchClientes()
    fetchServicos()
  }, [])

  if (loading) {
      return (
        <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Sincronizando Montagex...</p>
        </div>
      )
    }

  const filteredClientes = clientes.filter((cliente) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      cliente.nome.toLowerCase().includes(searchLower) ||
      cliente.telefone.includes(searchTerm)
    )
  })
  
  // Calcular novos clientes deste mês
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const novosEsteMes = clientes.filter((cliente) => {
    const created = new Date(cliente.created_at)
    return created.getMonth() === currentMonth && created.getFullYear() === currentYear
  }).length

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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes Particulares</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes particulares
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Clientes</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Novos este Mes</CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{novosEsteMes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Servicos Realizados</CardTitle>
            <User className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{servicosRealizados}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF ou telefone..."
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
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden lg:table-cell">Endereco</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="hidden sm:table-cell">Cadastro</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <p className="text-muted-foreground">Nenhum cliente encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {cliente.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{cliente.nome}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">
                            {(() => {
                              const endereco = cliente.endereco
                              if (!endereco) return '-'
                              if (typeof endereco === 'string') {
                                return (endereco as string)?.trim() ? endereco : '-'
                              }
                              // Se for objeto
                              const bairro = endereco.bairro || ''
                              const cidade = endereco.cidade || ''
                              if (bairro && cidade) return `${bairro}, ${cidade}`
                              if (bairro) return bairro
                              if (cidade) return cidade
                              return '-'
                            })()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <p className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {cliente.telefone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
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
                            <DropdownMenuItem>
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

      <NovoClienteDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={fetchClientes} />
    </div>
  )
}
