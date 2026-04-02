'use client'

import { useState } from 'react'
import {
  Search,
  Filter,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { mockLojas } from '@/lib/mock-data'

export default function PagamentosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Filtrar lojas com divida
  const lojasComDivida = mockLojas.filter(l => l.divida > 0)

  const filteredLojas = lojasComDivida.filter((loja) => {
    const matchesSearch = 
      loja.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loja.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (statusFilter === 'todos') return matchesSearch
    if (statusFilter === 'atrasado') return matchesSearch && loja.divida > 1000
    if (statusFilter === 'pendente') return matchesSearch && loja.divida <= 1000
    
    return matchesSearch
  })

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLojas.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredLojas.map(l => l.id))
    }
  }

  const stats = {
    totalDivida: mockLojas.reduce((acc, l) => acc + l.divida, 0),
    lojasComDivida: lojasComDivida.length,
    totalLojas: mockLojas.length,
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pagamentos e Recebimentos</h1>
          <p className="text-muted-foreground">
            Gerencie os pagamentos pendentes de lojas parceiras
          </p>
        </div>
        {selectedIds.length > 0 && (
          <Button className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Dar Baixa ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total a Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">
              R$ {stats.totalDivida.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lojas com Pendencia</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.lojasComDivida}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.totalLojas} lojas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lojas em Dia</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.totalLojas - stats.lojasComDivida}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por loja..."
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
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="atrasado">Atrasado</SelectItem>
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
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === filteredLojas.length && filteredLojas.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo de Repasse</TableHead>
                  <TableHead className="hidden lg:table-cell">Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Divida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLojas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-primary" />
                        <p className="text-muted-foreground">Todas as lojas estao em dia!</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLojas.map((loja) => {
                    const isAtrasado = loja.divida > 1000
                    
                    return (
                      <TableRow key={loja.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(loja.id)}
                            onCheckedChange={() => toggleSelect(loja.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{loja.nomeFantasia}</p>
                              <p className="text-xs text-muted-foreground">{loja.razaoSocial}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">
                            {loja.tipoRepasse === 'percentual'
                              ? `${loja.valorRepasse}%`
                              : `R$ ${loja.valorRepasse}`}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-sm">
                            <p>{loja.telefone}</p>
                            <p className="text-xs text-muted-foreground">{loja.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              isAtrasado
                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                : 'bg-chart-3/10 text-chart-3 border-chart-3/20'
                            )}
                          >
                            {isAtrasado ? (
                              <><AlertTriangle className="mr-1 h-3 w-3" /> Atrasado</>
                            ) : (
                              <><Clock className="mr-1 h-3 w-3" /> Pendente</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            'font-mono font-medium',
                            isAtrasado ? 'text-destructive' : 'text-chart-3'
                          )}>
                            R$ {loja.divida.toLocaleString('pt-BR')}
                          </span>
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
    </div>
  )
}
