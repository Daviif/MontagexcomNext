'use client'

import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CalendarCheck,
  CheckCircle2,
  Users,
  Building2,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RevenueBarChart, DonutChart } from '@/components/dashboard/charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DashboardData, OrdemServico, TopMontador } from '@/lib/types'

const statusColors: Record<string, string> = {
  agendada: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  em_andamento: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  concluida: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  cancelada: 'bg-destructive/10 text-destructive border-destructive/20',
}

const statusLabels: Record<string, string> = {
  agendada: 'Agendada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

const prioridadeColors: Record<string, string> = {
  baixa: 'bg-muted text-muted-foreground',
  normal: 'bg-blue-500/10 text-blue-500',
  alta: 'bg-orange-500/10 text-orange-500',
  urgente: 'bg-destructive/10 text-destructive font-bold',
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([])
  const [topMontadores, setTopMontadores] = useState<TopMontador[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [dashboardRes, ordensRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/servicos'),
        ])

        const raw = dashboardRes.data?.data ?? dashboardRes.data
        
        // Mapeamento seguro dos dados do backend
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

        setDashboardData(dash)
        setOrdensServico(ordensRes.data?.data ?? ordensRes.data ?? [])
        setTopMontadores(Array.isArray(raw.top_montadores) ? raw.top_montadores : [])
        setErro(null)
      } catch (err) {
        console.error('Erro ao buscar dados:', err)
        setErro('Não foi possível carregar os dados do dashboard.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Sincronizando Montagex...</p>
      </div>
    )
  }

  if (erro || !dashboardData) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-xl font-bold">Ops! Algo deu errado</h3>
        <p className="text-muted-foreground">{erro}</p>
        <button onClick={() => window.location.reload()} className="text-primary underline">Tentar novamente</button>
      </div>
    )
  }

  const { financeiro, operacional, graficos } = dashboardData

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-lg">Resumo operacional e financeiro da Montagex.</p>
      </div>

      {/* Grid Financeiro */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Visão Financeira</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Receita Total"
            value={financeiro.receitaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            icon={DollarSign}
            variant="success"
          />
          <StatsCard
            title="Despesas"
            value={financeiro.despesasTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            icon={TrendingDown}
            variant="destructive"
          />
          <StatsCard
            title="Lucro Líquido"
            value={financeiro.lucroLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            icon={TrendingUp}
            variant="success"
          />
          <StatsCard
            title="Pendentes (Lojas)"
            value={financeiro.pendentes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            icon={Clock}
            variant="warning"
          />
        </div>
      </section>

      {/* Grid Operacional */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Status Operacional</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Agendados" value={operacional.servicosAgendados} icon={CalendarCheck} variant="default" />
          <StatsCard title="Em Andamento" value={operacional.servicosEmAndamento} icon={Clock} variant="warning" />
          <StatsCard title="Concluídos" value={operacional.servicosConcluidos} icon={CheckCircle2} variant="success" />
          <StatsCard title="Montadores Ativos" value={operacional.montadoresAtivos} icon={Users} variant="default" />
        </div>
      </section>

      {/* Gráficos Principais */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueBarChart 
          data={graficos.receitaMensal} 
          title="Receita vs Despesas" 
          description="Comparativo mensal de fluxo de caixa" 
        />
        <DonutChart 
          data={graficos.receitasPorTipo} 
          title="Faturamento por Canal" 
          description="Lojas Parceiras vs Clientes Particulares" 
        />
      </div>

      {/* Listas Detalhadas */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Montadores */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <TrendingUp className="h-4 w-4 text-primary" /> Top Montadores (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {topMontadores.length === 0 && <p className="text-sm text-muted-foreground">Sem dados de produtividade.</p>}
            {topMontadores.slice(0, 5).map((m, i) => (
              <div key={m.id} className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i+1}</span>
                  <span className="text-sm font-medium">{m.nome}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">R$ {m.valor_total.toLocaleString('pt-BR')}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{m.qtd_servicos} serviços</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Lojas com Pendências */}
        <Card className="shadow-sm border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Building2 className="h-4 w-4 text-destructive" /> Pendências Financeiras (Lojas)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Exemplo estático (Ideal: conectar ao seu endpoint de financeiro) */}
            {[
              { nome: 'Casa & Conforto', valor: 2450.00, dias: 15 },
              { nome: 'Móveis Premium', valor: 1890.50, dias: 8 },
              { nome: 'Lar Decorado', valor: 980.00, dias: 5 },
            ].map((loja, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{loja.nome}</span>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mt-1", loja.dias > 10 ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600")}>
                    {loja.dias} dias em atraso
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-destructive">R$ {loja.valor.toLocaleString('pt-BR')}</p>
                  <button className="text-[10px] text-primary hover:underline font-bold uppercase mt-1">Cobrar</button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <CalendarCheck className="h-4 w-4 text-blue-500" /> 
              Próximas OS
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {ordensServico.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma OS agendada.</p>}
            {ordensServico.slice(0, 4).map((os) => (
              <div key={os.id} className="group flex flex-col gap-2 rounded-lg border border-border/50 bg-secondary/20 p-3 hover:bg-secondary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">{os.codigo_os_loja}</span>
                  <Badge className={cn("text-[9px] px-2 py-0", statusColors[os.status])}>
                    {statusLabels[os.status]}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="text-[10px]">{os.janelaHorario?.inicio || '08:00'} - {os.janelaHorario?.fim || '12:00'}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[9px] border-none p-0", prioridadeColors[os.prioridade || 'baixa'])}>
                    {(os.prioridade || 'baixa').toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>


      </div>
    </div>
  )
}