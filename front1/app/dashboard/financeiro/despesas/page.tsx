'use client'

import { useState } from 'react'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Fuel,
  Wrench,
  Package,
  Car,
  MoreVertical,
  Receipt,
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
import { mockDespesas } from '@/lib/mock-data'
import { NovaDespesaDialog } from '@/components/financeiro/nova-despesa-dialog'

const categoriaIcons: Record<string, React.ElementType> = {
  combustivel: Fuel,
  ferramentas: Wrench,
  material: Package,
  veiculo: Car,
  outros: MoreVertical,
}

const categoriaLabels: Record<string, string> = {
  combustivel: 'Combustivel',
  ferramentas: 'Ferramentas',
  material: 'Material',
  veiculo: 'Veiculo',
  outros: 'Outros',
}

const categoriaColors: Record<string, string> = {
  combustivel: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  ferramentas: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  material: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  veiculo: 'bg-primary/10 text-primary border-primary/20',
  outros: 'bg-muted text-muted-foreground border-muted',
}

export default function DespesasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredDespesas = mockDespesas.filter((despesa) => {
    const matchesSearch = despesa.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategoria = categoriaFilter === 'todas' || despesa.categoria === categoriaFilter
    return matchesSearch && matchesCategoria
  })

  // Calcular totais por categoria
  const totaisPorCategoria = mockDespesas.reduce((acc, d) => {
    acc[d.categoria] = (acc[d.categoria] || 0) + d.valor
    return acc
  }, {} as Record<string, number>)

  const totalGeral = mockDespesas.reduce((acc, d) => acc + d.valor, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Despesas</h1>
          <p className="text-muted-foreground">
            Registre e acompanhe as despesas operacionais
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <Receipt className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              R$ {totalGeral.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
        {Object.entries(totaisPorCategoria).slice(0, 4).map(([categoria, valor]) => {
          const Icon = categoriaIcons[categoria] || MoreVertical
          return (
            <Card key={categoria}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {categoriaLabels[categoria]}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {valor.toLocaleString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar despesas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas Categorias</SelectItem>
            <SelectItem value="combustivel">Combustivel</SelectItem>
            <SelectItem value="ferramentas">Ferramentas</SelectItem>
            <SelectItem value="material">Material</SelectItem>
            <SelectItem value="veiculo">Veiculo</SelectItem>
            <SelectItem value="outros">Outros</SelectItem>
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
                  <TableHead>Descricao</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDespesas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <p className="text-muted-foreground">Nenhuma despesa encontrada</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDespesas.map((despesa) => {
                    const Icon = categoriaIcons[despesa.categoria] || MoreVertical
                    return (
                      <TableRow key={despesa.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-lg',
                              categoriaColors[despesa.categoria].split(' ')[0]
                            )}>
                              <Icon className={cn(
                                'h-5 w-5',
                                categoriaColors[despesa.categoria].split(' ')[1]
                              )} />
                            </div>
                            <div>
                              <p className="font-medium">{despesa.descricao}</p>
                              {despesa.observacoes && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {despesa.observacoes}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('text-xs', categoriaColors[despesa.categoria])}>
                            {categoriaLabels[despesa.categoria]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(despesa.data).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium text-destructive">
                          R$ {despesa.valor.toLocaleString('pt-BR')}
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
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
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

      {/* Nova Despesa Dialog */}
      <NovaDespesaDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
