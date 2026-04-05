'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Loader2,
  MoreHorizontal,
  Eye,
  CheckCircle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { lojas, pagamentos_funcionarios_baixas, pagamentos_funcionarios, OrdemServico, Usuario } from '@/lib/types'
import { api } from '@/services/api'
import { toast } from 'sonner'
import { DetalhesPagamentSheet } from '@/components/financeiro/detalhes-pagamentos-sheet'
import { BaixaPagamentoDialog } from '@/components/financeiro/baixa-pagamento-dialog'

export default function PagamentosPage() {
  // --- ESTADOS DE UI E FILTRO ---
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // --- ESTADOS DE DADOS ---
  const [lojas, setLojas] = useState<lojas[]>([])
  const [baixas, setBaixas] = useState<pagamentos_funcionarios_baixas[]>([])
  const [pagamentos, setPagamentos] = useState<pagamentos_funcionarios[]>([])
  const [servicos, setServicos] = useState<OrdemServico[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // --- ESTADOS DE CONTROLE DE COMPONENTES INTEGRADOS ---
  const [lojaSelecionada, setLojaSelecionada] = useState<lojas | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pagamentoParaBaixa, setPagamentoParaBaixa] = useState<{id: string, valor: number} | null>(null)

  // --- LÓGICA DE CRUZAMENTO DE DADOS (Ponte entre Baixas e Lojas) ---

  const mapaPagamentoParaLoja = useMemo(() => {
    const mapa: Record<string, string> = {}
    /*console.log("Cruzando dados:", { 
    totalPagamentos: pagamentos.length, 
    totalServicos: servicos.length 
  })*/
    pagamentos.forEach(pgto => {
      const servicoVinculado = servicos.find(s => s.id === pgto.servico_id)
      if (servicoVinculado?.loja_id) {
        mapa[pgto.id] = servicoVinculado.loja_id
      }
    })
    //console.log("Mapa Gerado:", mapa)
    return mapa
  }, [pagamentos, servicos])

  const baixasPorLoja = useMemo(() => {
    const totais: Record<string, number> = {}
    baixas.forEach(baixa => {
      const lojaId = mapaPagamentoParaLoja[baixa.pagamento_funcionario_id]
      if (lojaId) {
        totais[lojaId] = (totais[lojaId] || 0) + Number(baixa.valor || 0)
      }
    })
    return totais
  }, [baixas, mapaPagamentoParaLoja])

  // --- FILTRAGEM ---
  const filteredLojas = useMemo(() => {
    return lojas.filter((loja) => {
      const valorBaixado = baixasPorLoja[loja.id] || 0
      const saldoDevedor = Number(loja.divida || 0) - valorBaixado
      
      const matchesSearch = 
        (loja.nome_fantasia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (loja.razao_social || '').toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false
      
      // Oculta lojas com saldo zero apenas se não houver filtro ativo
      if (saldoDevedor <= 0 && statusFilter !== 'todos') return false

      if (statusFilter === 'todos') return true
      if (statusFilter === 'atrasado') return saldoDevedor > 1000
      if (statusFilter === 'pendente') return saldoDevedor > 0 && saldoDevedor <= 1000
      
      return true
    })
  }, [lojas, searchTerm, statusFilter, baixasPorLoja])

  // --- ESTATÍSTICAS ---
  const stats = useMemo(() => {
    const totalDividaOriginal = lojas.reduce((acc, l) => acc + Number(l.divida || 0), 0)
    const totalBaixadoGeral = Object.values(baixasPorLoja).reduce((acc, val) => acc + val, 0)
    const saldoLiquido = totalDividaOriginal - totalBaixadoGeral

    const lojasComPendencia = lojas.filter(l => {
        const baixado = baixasPorLoja[l.id] || 0
        return (Number(l.divida) - baixado) > 0
    }).length

    return {
      totalAReceber: saldoLiquido,
      lojasComDivida: lojasComPendencia,
      totalLojas: lojas.length,
    }
  }, [lojas, baixasPorLoja])

  // --- FETCH DE DADOS ---
  const fetchData = async () => {
    try {
      setLoading(true)
      const [resLojas, resBaixa, resPagamentos, resServicos, resUser] = await Promise.all([
        api.get('/lojas'),
        api.get('/pagamentos_funcionarios_baixas'),
        api.get('/pagamentos_funcionarios'),
        api.get('/servicos'),
        api.get('/usuarios')
      ])

      setLojas(resLojas.data?.data ?? resLojas.data ?? [])
      setBaixas(resBaixa.data?.data ?? resBaixa.data ?? [])
      setPagamentos(resPagamentos.data?.data ?? resPagamentos.data ?? [])
      setServicos(resServicos.data?.data ?? resServicos.data ?? [])
      setUsuarios(resUser.data?.data ?? resUser.data ?? [])
    } catch (err) {
      console.error(err)
      setErro('Não foi possível carregar os dados financeiros.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (lojaSelecionada) {
      const vinculados = pagamentos.filter(p => mapaPagamentoParaLoja[p.id] === lojaSelecionada.id);
      console.log(`Dados para ${lojaSelecionada.nome_fantasia}:`, {
        totalPagamentos: vinculados.length,
        montadoresDiferentes: [...new Set(vinculados.map(p => p.usuario_id))]
      });
    }
  }, [lojaSelecionada, pagamentos, mapaPagamentoParaLoja]);

  useEffect(() => { fetchData() }, [])

  // --- AÇÕES ---
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLojas.length) setSelectedIds([])
    else setSelectedIds(filteredLojas.map(l => l.id))
  }

  const handleVerDetalhes = (loja: lojas) => {
    setLojaSelecionada(loja)
    setSheetOpen(true)
  }

  const handleAbrirBaixa = (loja: lojas) => {
    setLojaSelecionada(loja);

    const pagtosDestaLoja = pagamentos.filter(p => mapaPagamentoParaLoja[p.id] === loja.id);

    console.log(`Abrindo baixa para loja ${loja.nome_fantasia}. Pagamentos encontrados:`, pagtosDestaLoja.length);
    
    const pagto = pagamentos.find(p => mapaPagamentoParaLoja[p.id] === loja.id)
    if (pagto) {
      const jaBaixado = baixas
        .filter(b => b.pagamento_funcionario_id === pagto.id)
        .reduce((a, b) => a + Number(b.valor), 0)
      
      setPagamentoParaBaixa({ id: pagto.id, valor: Number(pagto.valor) - jaBaixado })
      setDialogOpen(true)
    } else {
      toast.error("Nenhum lançamento pendente encontrado para esta loja.")
    }
  }


  if (loading) return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando informações financeiras...</p>
    </div>
  )

  if (erro) return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-2">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <p className="font-medium text-destructive">{erro}</p>
      <Button variant="outline" onClick={() => fetchData()}>Tentar Novamente</Button>
    </div>
  )
  
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pagamentos e Recebimentos</h1>
          <p className="text-muted-foreground">
            Gerencie as pendências financeiras das lojas parceiras
          </p>
        </div>
        {selectedIds.length > 0 && (
          <Button className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Dar Baixa em Lote ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total a Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.totalAReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lojas com Pendência</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.lojasComDivida}</div>
            <p className="text-xs text-muted-foreground">de {stats.totalLojas} lojas</p>
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
            placeholder="Buscar por nome da loja..."
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
            <SelectItem value="atrasado">Atrasado {("(> R$ 1.000)")}</SelectItem>
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
                  <TableHead>Loja Parceira</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Dívida Original</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Total Baixado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Saldo Devedor</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLojas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <p className="text-muted-foreground">Nenhuma pendência encontrada.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLojas.map((loja) => {
                    const valorBaixado = baixasPorLoja[loja.id] || 0
                    const saldo = Number(loja.divida) - valorBaixado
                    const isAtrasado = saldo > 1000

                    return (
                      <TableRow key={loja.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(loja.id)}
                            onCheckedChange={() => toggleSelect(loja.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{loja.nome_fantasia}</p>
                            <p className="text-xs text-muted-foreground">{loja.razao_social}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right font-mono text-xs text-muted-foreground">
                          {Number(loja.divida).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right font-mono text-xs text-emerald-600">
                          {valorBaixado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] uppercase font-bold',
                              isAtrasado ? 'bg-destructive/10 text-destructive' : 'bg-chart-3/10 text-chart-3'
                            )}
                          >
                            {isAtrasado ? 'Atrasado' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          <span className={cn(isAtrasado ? 'text-destructive' : 'text-foreground')}>
                            {saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleVerDetalhes(loja)}>
                                <Eye className="mr-2 h-4 w-4" /> Detalhes / Extrato
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-primary" onClick={() => handleAbrirBaixa(loja)}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Registrar Baixa
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

      {/* COMPONENTES DE DIÁLOGO E SHEET */}
      
      <BaixaPagamentoDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        loja={lojaSelecionada}
        pagamentos={pagamentos}
        servicosDaLoja={servicos.filter(s => s.loja_id === lojaSelecionada?.id)}
        baixas={baixas}
        usuarios={usuarios}
        onSuccess={fetchData}
      />

      {lojaSelecionada && (
        <DetalhesPagamentSheet 
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          loja={lojaSelecionada!}
          servicosDaLoja={servicos.filter(s => s.loja_id === lojaSelecionada?.id)}
          baixasDaLoja={baixas.filter(b => mapaPagamentoParaLoja[b.pagamento_funcionario_id] === lojaSelecionada?.id)}
          pagamentosDaLoja={pagamentos}
          usuarios={usuarios}
        />
      )}
    </div>
  )
}