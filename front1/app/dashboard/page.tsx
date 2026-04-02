'use client'

import { useEffect, useState } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown, 
  Clock,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Users,
  Building2,
  Wallet,
} from 'lucide-react'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RevenueBarChart, DonutChart } from '@/components/dashboard/charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DashboardData, OrdemServico } from '@/lib/types'

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
  baixa: 'bg-muted text-muted-foreground',
  normal: 'bg-chart-2/10 text-chart-2',
  alta: 'bg-chart-3/10 text-chart-3',
  urgente: 'bg-destructive/10 text-destructive',
}

export default function DashboardPage() {

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([])
  const [erro, setErro] = useState(null)

  useEffect(() => {
  fetch('http://localhost:3001/api/dashboard')
    .then(res => {
      if (!res.ok) throw new Error('Erro ao buscar dados')
      return res.json()
    })
    .then(setDashboardData)
    .catch(setErro)

  fetch('http://localhost:3001/api/ordens-servico')
    .then(res => {
      if (!res.ok) throw new Error('Erro ao buscar OS')
      return res.json()
    })
    .then(setOrdensServico)
    .catch(console.error)
}, [])

  if (erro) return <div>Erro ao carregar dados</div>
  if (!dashboardData) return <div>Carregando...</div>
  const { financeiro, operacional, graficos } = dashboardData

  const receitaFormatada = financeiro.receitaTotal.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  const despesaFormatada = financeiro.despesasTotal.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  const lucroFormatado = financeiro.lucroLiquido.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  const pendentesFormatado = financeiro.pendentes.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  // Formata dados para os graficos
  const receitaPorTipo = graficos.receitasPorTipo.map((item: { tipo: string; valor: number }) => ({
    name: item.tipo,
    value: item.valor,
  }))

  const despesasPorCategoria = graficos.despesasPorCategoria.map((item: { categoria: string; valor: number }) => ({
    name: item.categoria,
    value: item.valor,
  }))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao Montagex. Veja o resumo das suas operacoes.
        </p>
      </div>

      {/* Cards Financeiros */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Financeiro</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Receita Total"
            value={receitaFormatada}
            icon={DollarSign}
            variant="success"
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatsCard
            title="Despesas"
            value={despesaFormatada}
            icon={TrendingDown}
            variant="destructive"
            trend={{ value: 8.2, isPositive: false }}
          />
          <StatsCard
            title="Lucro Liquido"
            value={lucroFormatado}
            icon={TrendingUp}
            variant="success"
            trend={{ value: 15.3, isPositive: true }}
          />
          <StatsCard
            title="Pendentes"
            value={pendentesFormatado}
            icon={Clock}
            variant="warning"
            description={`${operacional.servicosAgendados} servicos aguardando`}
          />
        </div>
      </div>

      {/* Cards Operacionais */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Operacional</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Servicos Agendados"
            value={operacional.servicosAgendados}
            icon={CalendarCheck}
            variant="default"
          />
          <StatsCard
            title="Em Andamento"
            value={operacional.servicosEmAndamento}
            icon={Clock}
            variant="warning"
          />
          <StatsCard
            title="Concluidos"
            value={operacional.servicosConcluidos}
            icon={CheckCircle2}
            variant="success"
            description="Este mes"
          />
          <StatsCard
            title="Cancelados"
            value={operacional.servicosCancelados}
            icon={XCircle}
            variant="destructive"
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Montadores Ativos"
            value={operacional.montadoresAtivos}
            icon={Users}
            variant="default"
          />
          <StatsCard
            title="Equipes Ativas"
            value={operacional.equipesAtivas}
            icon={Users}
            variant="default"
          />
          <StatsCard
            title="Clientes Ativos"
            value={operacional.clientesAtivos}
            icon={Users}
            variant="default"
          />
          <StatsCard
            title="Lojas Parceiras"
            value={operacional.lojasAtivas}
            icon={Building2}
            variant="default"
          />
        </div>
      </div>

      {/* Graficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueBarChart
          data={graficos.receitaMensal}
          title="Receita vs Despesas"
          description="Comparativo mensal de receitas e despesas"
        />
        <DonutChart
          data={receitaPorTipo}
          title="Receita por Tipo de Cliente"
          description="Distribuicao de receita entre lojas e particulares"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DonutChart
          data={despesasPorCategoria}
          title="Despesas por Categoria"
          description="Distribuicao das despesas operacionais"
        />

        {/* Proximas OS */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Proximas Ordens de Servico</CardTitle>
            <p className="text-sm text-muted-foreground">Servicos agendados para os proximos dias</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {ordensServico.slice(0, 4).map((os: OrdemServico) => (
                <div
                  key={os.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{os.numero}</span>
                      <Badge variant="outline" className={cn('text-xs', prioridadeColors[os.prioridade])}>
                        {os.prioridade}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {os.enderecoEntrega.bairro}, {os.enderecoEntrega.cidade}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className={cn('text-xs', statusColors[os.status])}>
                      {statusLabels[os.status]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {os.janelaHorario.inicio} - {os.janelaHorario.fim}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Rapido */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Wallet className="h-4 w-4 text-primary" />
              Fluxo de Caixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Entradas</span>
                <span className="text-sm font-medium text-primary">
                  +R$ {(financeiro.receitaTotal).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Saidas</span>
                <span className="text-sm font-medium text-destructive">
                  -R$ {financeiro.despesasTotal.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Saldo</span>
                  <span className="text-sm font-bold text-primary">
                    R$ {financeiro.lucroLiquido.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Users className="h-4 w-4 text-primary" />
              Top Montadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {[
                { nome: 'Carlos Silva', servicos: 45, valor: 'R$ 8.500' },
                { nome: 'Roberto Santos', servicos: 38, valor: 'R$ 6.200' },
                { nome: 'Fernando Lima', servicos: 32, valor: 'R$ 5.100' },
              ].map((montador, index) => (
                <div key={montador.nome} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                    <span className="text-sm">{montador.nome}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{montador.valor}</p>
                    <p className="text-xs text-muted-foreground">{montador.servicos} servicos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Building2 className="h-4 w-4 text-primary" />
              Lojas com Pendencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {[
                { nome: 'Casa & Conforto', divida: 2450, dias: 15 },
                { nome: 'Moveis Premium', divida: 1890, dias: 8 },
                { nome: 'Lar Decorado', divida: 980, dias: 5 },
              ].map((loja) => (
                <div key={loja.nome} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm">{loja.nome}</span>
                    <span className="text-xs text-muted-foreground">{loja.dias} dias em atraso</span>
                  </div>
                  <span className="text-sm font-medium text-destructive">
                    R$ {loja.divida.toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
