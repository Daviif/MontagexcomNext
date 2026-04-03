'use client'

import Link from 'next/link'
import {useState, useEffect} from 'react'
import { api } from '@/services/api'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Building2,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { mockDashboardData, mockSalarios, mockDespesas, mockLojas } from '@/lib/mock-data'
import { RevenueBarChart, DonutChart } from '@/components/dashboard/charts'
import { cn } from '@/lib/utils'
import { DashboardData, Salario, despesa, lojas } from '@/lib/types'

export default function FinanceiroPage() {
  const [data, setData] = useState <DashboardData | null>(null)
  const [salarios, setSalarios] = useState<Salario[]>([])
  const [lojas, setLojas] = useState<lojas[]>([])
  const [loading, setLoading] = useState(true)
  

  useEffect(() => {
    async function fetchFinanceiro(){
      try {
        setLoading(true)
        const [dashboardRes, salariosRes, lojasRes] = await Promise.all([
          api.get('/dashboard'), // Ajuste para sua rota de estatísticas
          api.get('/pagamentos_funcionarios'), 
          api.get('/lojas')
        ])

        const raw = dashboardRes.data?.data ?? dashboardRes.data
                
        const dash: DashboardData = {
          financeiro: {
          receitaTotal: raw.financeiro?.total_recebido ?? 0,
          receitaLojas: raw.financeiro?.receita_lojas ?? 0,
          receitaParticulares: raw.financeiro?.receita_particulares ?? 0,
          despesasTotal: raw.financeiro?.total_despesas ?? 0,
          lucroLiquido: raw.financeiro?.lucro ?? 0,
          pendentes: raw.financeiro?.pendente ?? 0,
          margemLucro: raw.financeiro?.margem_lucro ?? 0,
          },
          operacional: {
            servicosAgendados: raw.servicos?.agendados ?? 0,
            servicosEmAndamento: raw.servicos?.em_andamento ?? 0,
            servicosConcluidos: raw.servicos?.realizados ?? 0,
            servicosCancelados: raw.servicos?.cancelados ?? 0,
            montadoresAtivos: raw.equipe?.montadores_ativos ?? 0,
            equipesAtivas: raw.equipe?.equipes_ativas ?? 0,
            clientesAtivos: raw.equipe?.clientes_ativos ?? 0,
            lojasAtivas: raw.equipe?.lojas_ativas ?? 0,
          },
          graficos: {
            receitasPorTipo: (raw.graficos?.receitas_por_tipo ?? []).map((item: any) => ({
            tipo: item.name || item.tipo_cliente || 'Outros',
            valor: item.value ?? item.valor ?? 0,
            value: item.value ?? item.valor ?? 0
            })),
            receitaMensal: (raw.graficos?.despesas_mensais ?? []).map((item: any) => ({
              mes: item.name || item.mes || '-',
              receita: item.receita ?? 0,
              despesa: item.despesas ?? item.despesa ?? 0
            })),
            despesasPorCategoria: (raw.graficos?.despesas_por_categoria ?? []).map((item: any) => ({
              categoria: item.categoria || item.name || 'Geral',
              valor: item.value ?? item.valor ?? 0,
              value: item.value ?? item.valor ?? 0
            })),
            servicosPorStatus: [],
         },
          periodo: raw.periodo ?? {},
        }
        setData(dash)
        setSalarios(salariosRes.data?.data ?? salariosRes.data ?? [])
        setLojas(lojasRes.data?.data ?? lojasRes.data ?? [])
      } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchFinanceiro()
  }, [])

  if (loading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const { financeiro, graficos } = data

  const despesasPorCategoria = data?.graficos?.despesasPorCategoria?.map((item) => ({
    name: item.categoria,
    value: item.valor,
  })) || []

  const receitaMensal = data?.graficos?.receitaMensal || []

  const salariosPendentes = salarios
    .filter(s => s.status === 'pendente')
    .reduce((acc, s) => acc + Number(s.valorLiquido || 0), 0)

  const salariosPagos = salarios
    .filter(s => s.status === 'pago')
    .reduce((acc, s) => acc + Number(s.valorLiquido || 0), 0)

  const dividaLojas = lojas.reduce((acc, l) => acc + Number(l.divida || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <p className="text-muted-foreground">
          Visao geral das financas da empresa
        </p>
      </div>

      {/* Cards Principais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              R$ {financeiro.receitaTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-primary">
              <ArrowUpRight className="h-3 w-3" />
              Margem: {financeiro.margemLucro.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              R$ {financeiro.despesasTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
              <ArrowDownRight className="h-3 w-3" />
              +8.2% vs mes anterior
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Liquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              R$ {financeiro.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-primary">
              <ArrowUpRight className="h-3 w-3" />
              +15.3% vs mes anterior
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
            <Wallet className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              R$ {financeiro.pendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              De clientes e lojas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Links Rapidos */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/financeiro/salarios">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Salarios</p>
                <p className="text-sm text-muted-foreground">
                  R$ {salariosPendentes.toLocaleString('pt-BR')} pendentes
                </p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/financeiro/pagamentos">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10">
                <CreditCard className="h-6 w-6 text-chart-3" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Pagamentos</p>
                <p className="text-sm text-muted-foreground">
                  R$ {dividaLojas.toLocaleString('pt-BR')} em aberto
                </p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/financeiro/despesas">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                <Receipt className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Despesas</p>
                <p className="text-sm text-muted-foreground">
                  {despesasPorCategoria.length} registros este mes
                </p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Graficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueBarChart
          data={graficos.receitaMensal}
          title="Receita vs Despesas"
          description="Comparativo mensal"
        />
        <DonutChart
          data={despesasPorCategoria}
          title="Despesas por Categoria"
          description="Distribuicao das despesas"
        />
      </div>

      {/* Resumos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ultimas Receitas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Receitas por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Lojas Parceiras</p>
                    <p className="text-xs text-muted-foreground">12 lojas ativas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">R$ {financeiro.receitaLojas.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground">
                    {((financeiro.receitaLojas / financeiro.receitaTotal) * 100).toFixed(0)}% do total
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                    <Users className="h-5 w-5 text-chart-2" />
                  </div>
                  <div>
                    <p className="font-medium">Clientes Particulares</p>
                    <p className="text-xs text-muted-foreground">45 clientes</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">R$ {financeiro.receitaParticulares.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground">
                    {((financeiro.receitaParticulares / financeiro.receitaTotal) * 100).toFixed(0)}% do total
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status de Pagamentos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Status de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm">Salarios Pagos</span>
                </div>
                <span className="font-medium">R$ {salariosPagos.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-chart-3" />
                  <span className="text-sm">Salarios Pendentes</span>
                </div>
                <span className="font-medium text-chart-3">R$ {salariosPendentes.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive" />
                  <span className="text-sm">Dividas de Lojas</span>
                </div>
                <span className="font-medium text-destructive">R$ {dividaLojas.toLocaleString('pt-BR')}</span>
              </div>
              <div className="border-t border-border pt-4 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total a Pagar</span>
                  <span className="text-lg font-bold">
                    R$ {(salariosPendentes + dividaLojas).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
