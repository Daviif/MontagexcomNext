'use client'

import { useState, useEffect, useMemo } from 'react'
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
  Loader2,
  Utensils,
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
import { NovaDespesaDialog } from '@/components/financeiro/nova-despesa-dialog'
import { despesa } from '@/lib/types'
import { api } from '@/services/api'

interface DespesaFormatada extends despesa {
  categoriaKey: string;
  categoriaOriginal: string;
  observacoes?: string; // Caso não esteja no tipo base
}

const categoriaIcons: Record<string, React.ElementType> = {
  combustivel: Fuel,
  ferramentas: Wrench,
  material: Package,
  veiculo: Car,
  alimentacao: Utensils,
  outros: MoreVertical,
}

const categoriaColors: Record<string, string> = {
  combustivel: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  ferramentas: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  material: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  veiculo: 'bg-primary/10 text-primary border-primary/20',
  alimentacao: 'bg-orange-500/10 text-orange-600 border-orange-200',
  outros: 'bg-muted text-muted-foreground border-muted',
}
const normalizeKey = (key: string) => 
  key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

export default function DespesasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [despesas, setDespesas] = useState<DespesaFormatada[]>([])

  useEffect(() => {
    async function fetchDespesas(){
      try{
        setLoading(true)
        const res = await api.get('/despesas')

        const listaRaw = res.data?.despesas || []
        const listaFormatada: DespesaFormatada[] = listaRaw.map((d: DespesaFormatada) => ({
          ...d,
          valor: Number(d.valor), 
          categoriaOriginal: d.categoria, 
          categoriaKey: normalizeKey(d.categoria)
        }))

        setDespesas(listaFormatada)
        console.log("Despesas carregadas:", res.data)
      } catch (error){
          console.error("Erro ao buscar despesas:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDespesas()
  }, [])

  const filteredDespesas = useMemo(() => {
    return despesas.filter((d) => {
      const matchesSearch = d.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategoria = categoriaFilter === 'todas' || d.categoriaKey === categoriaFilter
      return matchesSearch && matchesCategoria
    })
  }, [despesas, searchTerm, categoriaFilter])

  const totalGeral = useMemo(() => 
    filteredDespesas.reduce((acc, d) => acc + d.valor, 0), 
  [filteredDespesas])

  const totaisPorCategoria = useMemo(() => {
    return despesas.reduce((acc, d) => {
      acc[d.categoriaKey] = {
        label: d.categoriaOriginal,
        total: (acc[d.categoriaKey]?.total || 0) + d.valor
      }
      return acc
    }, {} as Record<string, { label: string, total: number }>)
  }, [despesas])


  if (loading) return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )

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
              {totalGeral.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
            </div>
          </CardContent>
        </Card>
        {Object.entries(totaisPorCategoria).slice(0, 4).map(([key, info]) => {
          const Icon = categoriaIcons[key] || MoreVertical
          return (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {info.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {info.total.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'} )}
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

                    const key = despesa.categoriaKey || 'outros';

                    const Icon = categoriaIcons[key] || MoreVertical;
                    const colorClass = categoriaColors[key] || categoriaColors.outros;
                    
                    return (
                      <TableRow key={despesa.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-lg',
                              colorClass.split(' ')[0]
                            )}>
                              <Icon className={cn(
                                'h-5 w-5',
                                colorClass.split(' ')[1]
                              )} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">
                                {despesa.descricao}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('text-xs', colorClass)}>
                            {despesa.categoriaOriginal || despesa.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const dataRaw = despesa.data_despesa;
                            if (!dataRaw) return "Sem data";
                            const dataObj = new Date(dataRaw.toString().split('T')[0] + "T00:00:00");

                            return !isNaN(dataObj.getTime()) ? dataObj.toLocaleDateString('pt-BR') : "Data inválida";
                          })()}
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
