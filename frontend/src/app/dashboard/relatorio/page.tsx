'use client'

import { useEffect, useMemo, useState } from 'react'
import {
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	Loader2,
	AlertTriangle,
	TrendingUp,
	TrendingDown,
	Wallet,
	Target,
	Hammer,
	Receipt,
	BarChart3,
	Building2,
	Package,
} from 'lucide-react'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DonutChart, TrendAreaChart } from '@/components/dashboard/charts'
import { DashboardData, despesa, OrdemServico, pagamentos_funcionarios, GraficoItem, lojas, clientes_particulares, Produto } from '@/lib/types'

interface ServicoProdutoReportItem {
	id: string
	servico_id: string
	produto_id: string
	quantidade: number
	valor_total: number
	Produto?: {
		id?: string
		nome?: string
	} | null
}

const toNumber = (value: unknown) => {
	const parsed = Number(value ?? 0)
	return Number.isFinite(parsed) ? parsed : 0
}

const parseDateOnlyToLocal = (value: unknown) => {
	if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
		const [year, month, day] = value.split('-').map(Number)
		return new Date(year, month - 1, day)
	}

	if (value instanceof Date) return value

	return value ? new Date(value as string) : null
}

const inSameMonth = (date: Date | null, baseDate: Date) => {
	if (!date || Number.isNaN(date.getTime())) return false
	return (
		date.getFullYear() === baseDate.getFullYear() &&
		date.getMonth() === baseDate.getMonth()
	)
}

export default function RelatorioPage() {
	const [loading, setLoading] = useState(true)
	const [erro, setErro] = useState<string | null>(null)

	const [mesSelecionado, setMesSelecionado] = useState(() => {
		const hoje = new Date()
		return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
	})

	const mesAtual = useMemo(() => {
		const hoje = new Date()
		return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
	}, [])

	const podeAvancarMes = useMemo(() => mesSelecionado.getTime() < mesAtual.getTime(), [mesSelecionado, mesAtual])

	const tituloMesSelecionado = useMemo(() => {
		return mesSelecionado.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
	}, [mesSelecionado])

	const [dashboard, setDashboard] = useState<DashboardData | null>(null)
	const [dashboardAnterior, setDashboardAnterior] = useState<DashboardData | null>(null)
	const [despesas, setDespesas] = useState<despesa[]>([])
	const [servicos, setServicos] = useState<OrdemServico[]>([])
	const [pagamentos, setPagamentos] = useState<pagamentos_funcionarios[]>([])
	const [lojas, setLojas] = useState<lojas[]>([])
	const [clientes, setClientes] = useState<clientes_particulares[]>([])
	const [produtos, setProdutos] = useState<Produto[]>([])
	const [servicoProdutosMes, setServicoProdutosMes] = useState<ServicoProdutoReportItem[]>([])

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true)
				setErro(null)

				const ano = mesSelecionado.getFullYear()
				const mes = mesSelecionado.getMonth() + 1
				const mesAnteriorRef = new Date(mesSelecionado.getFullYear(), mesSelecionado.getMonth() - 1, 1)
				const anoAnterior = mesAnteriorRef.getFullYear()
				const mesAnterior = mesAnteriorRef.getMonth() + 1

				const [dashboardRes, dashboardAnteriorRes, despesasRes, servicosRes, pagamentosRes, lojasRes, clientesRes, produtosRes] = await Promise.all([
					api.get('/dashboard', { params: { ano, mes } }),
					api.get('/dashboard', { params: { ano: anoAnterior, mes: mesAnterior } }),
					api.get('/despesas'),
					api.get('/servicos'),
					api.get('/pagamentos_funcionarios'),
					api.get('/lojas'),
					api.get('/clientes_particulares'),
					api.get('/produtos'),
				])

				const raw = dashboardRes.data?.data ?? dashboardRes.data
				const rawAnterior = dashboardAnteriorRes.data?.data ?? dashboardAnteriorRes.data

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
						receitasPorTipo: (raw.graficos?.receitas_por_tipo ?? []).map((item: GraficoItem) => ({
							name: item.name || item.tipo_cliente || 'Outros',
							value: item.value ?? item.valor ?? 0,
						})),
						receitaMensal: (raw.graficos?.despesas_mensais ?? []).map((item: GraficoItem) => ({
							mes: item.name || item.mes || '-',
							receita: item.receita ?? 0,
							despesa: item.despesas ?? item.despesa ?? 0,
						})),
						despesasPorCategoria: (raw.graficos?.despesas_por_categoria ?? []).map((item: GraficoItem) => ({
							categoria: item.categoria || item.name || 'Geral',
							valor: item.value ?? item.valor ?? 0,
							value: item.value ?? item.valor ?? 0,
						})),
						servicosPorStatus: [],
					},
					periodo: raw.periodo ?? {},
				}

				const dashAnterior: DashboardData = {
					financeiro: {
						receitaTotal: rawAnterior.financeiro?.total_recebido ?? 0,
						receitaLojas: rawAnterior.financeiro?.receita_lojas ?? 0,
						receitaParticulares: rawAnterior.financeiro?.receita_particulares ?? 0,
						despesasTotal: rawAnterior.financeiro?.total_despesas ?? 0,
						lucroLiquido: rawAnterior.financeiro?.lucro ?? 0,
						pendentes: rawAnterior.financeiro?.pendente ?? 0,
						margemLucro: rawAnterior.financeiro?.margem_lucro ?? 0,
					},
					operacional: {
						servicosAgendados: rawAnterior.servicos?.agendados ?? 0,
						servicosEmAndamento: rawAnterior.servicos?.em_andamento ?? 0,
						servicosConcluidos: rawAnterior.servicos?.realizados ?? 0,
						servicosCancelados: rawAnterior.servicos?.cancelados ?? 0,
						montadoresAtivos: rawAnterior.equipe?.montadores_ativos ?? 0,
						equipesAtivas: rawAnterior.equipe?.equipes_ativas ?? 0,
						clientesAtivos: rawAnterior.equipe?.clientes_ativos ?? 0,
						lojasAtivas: rawAnterior.equipe?.lojas_ativas ?? 0,
					},
					graficos: {
						receitasPorTipo: [],
						receitaMensal: [],
						despesasPorCategoria: [],
						servicosPorStatus: [],
					},
					periodo: rawAnterior.periodo ?? {},
				}

				const servicosLista = servicosRes.data?.data ?? servicosRes.data ?? []
				const servicosMesIds = servicosLista
					.filter((servico: OrdemServico) => inSameMonth(parseDateOnlyToLocal(servico.data_servico), mesSelecionado))
					.map((servico: OrdemServico) => servico.id)

				const detalhesServicoProdutosRes = await Promise.allSettled(
					servicosMesIds.map((servicoId: string) => api.get(`/servico_produtos/${servicoId}`))
				)

				const detalhesServicoProdutos = detalhesServicoProdutosRes
					.filter((result): result is PromiseFulfilledResult<{ data: ServicoProdutoReportItem[] }> => result.status === 'fulfilled')
					.flatMap((result) => result.value.data ?? [])

				setDashboard(dash)
				setDashboardAnterior(dashAnterior)
				setDespesas(despesasRes.data?.despesas ?? despesasRes.data?.data ?? despesasRes.data ?? [])
				setServicos(servicosLista)
				setPagamentos(pagamentosRes.data?.data ?? pagamentosRes.data ?? [])
				setLojas(lojasRes.data?.data ?? lojasRes.data ?? [])
				setClientes(clientesRes.data?.data ?? clientesRes.data ?? [])
				setProdutos(produtosRes.data?.data ?? produtosRes.data ?? [])
				setServicoProdutosMes(detalhesServicoProdutos)
			} catch (error) {
				console.error('Erro ao carregar relatórios:', error)
				setErro('Não foi possível carregar os dados de relatórios.')
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [mesSelecionado])

	const analytics = useMemo(() => {
		if (!dashboard || !dashboardAnterior) {
			return null
		}

		const servicosMes = servicos.filter((servico) => inSameMonth(parseDateOnlyToLocal(servico.data_servico), mesSelecionado))

		const despesasMes = despesas.filter((item) => inSameMonth(parseDateOnlyToLocal(item.data_despesa), mesSelecionado))
		const totalDespesasMes = despesasMes.reduce((acc, item) => acc + toNumber(item.valor), 0)

		const pagamentosPagosMes = pagamentos.filter((pagamento) => {
			const dataPagamento = parseDateOnlyToLocal(pagamento.data_pagamento)
			return inSameMonth(dataPagamento, mesSelecionado)
		})

		const custoFolhaPaga = pagamentosPagosMes.reduce((acc, pagamento) => {
			const valorPago = toNumber(pagamento.valor_pago)
			if (valorPago > 0) return acc + valorPago
			if (pagamento.status === 'pago') return acc + toNumber(pagamento.valor)
			return acc
		}, 0)

		const pagamentosPrevistosMes = pagamentos.filter((pagamento) => {
			const dataVencimento = parseDateOnlyToLocal(pagamento.data_vencimento)
			return inSameMonth(dataVencimento, mesSelecionado)
		})

		const custoFolhaPrevista = pagamentosPrevistosMes.reduce((acc, pagamento) => acc + toNumber(pagamento.valor), 0)

		const custoTotalRealizado = totalDespesasMes + custoFolhaPaga
		const receitaTotal = toNumber(dashboard.financeiro.receitaTotal)
		const lucroLiquido = toNumber(dashboard.financeiro.lucroLiquido)
		const receitaMesAnterior = toNumber(dashboardAnterior.financeiro.receitaTotal)

		const servicosConcluidos = servicosMes.filter((servico) => ['concluido', 'concluida'].includes((servico.status || '').toLowerCase())).length
		const servicosCancelados = servicosMes.filter((servico) => ['cancelado', 'cancelada'].includes((servico.status || '').toLowerCase())).length
		const servicosTotal = servicosMes.length

		const ticketMedio = servicosConcluidos > 0 ? receitaTotal / servicosConcluidos : 0
		const custoPorServico = servicosConcluidos > 0 ? custoTotalRealizado / servicosConcluidos : 0
		const margemContribuicao = receitaTotal > 0 ? ((receitaTotal - custoTotalRealizado) / receitaTotal) * 100 : 0
		const taxaCancelamento = servicosTotal > 0 ? (servicosCancelados / servicosTotal) * 100 : 0

		const diasNoMesAtual = new Date(mesSelecionado.getFullYear(), mesSelecionado.getMonth() + 1, 0).getDate()
		const diasNoMesAnterior = new Date(mesSelecionado.getFullYear(), mesSelecionado.getMonth(), 0).getDate()
		const isMesCorrente =
			mesSelecionado.getFullYear() === mesAtual.getFullYear() &&
			mesSelecionado.getMonth() === mesAtual.getMonth()
		const diasReferencia = isMesCorrente ? new Date().getDate() : diasNoMesAtual

		const valorMedioPorDia = diasReferencia > 0 ? receitaTotal / diasReferencia : 0
		const custoPorOS = servicosConcluidos > 0 ? custoTotalRealizado / servicosConcluidos : 0
		const projecaoMesBaseAnterior = diasNoMesAnterior > 0 ? (receitaMesAnterior / diasNoMesAnterior) * diasNoMesAtual : 0

		const producaoPorDiaMap = servicosMes.reduce<Record<string, number>>((acc, servico) => {
			const data = parseDateOnlyToLocal(servico.data_servico)
			if (!data) return acc
			const chave = `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`
			acc[chave] = (acc[chave] || 0) + 1
			return acc
		}, {})

		const producaoPorDia = Object.entries(producaoPorDiaMap)
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => {
				const [diaA, mesA] = a.name.split('/').map(Number)
				const [diaB, mesB] = b.name.split('/').map(Number)
				if (mesA !== mesB) return mesA - mesB
				return diaA - diaB
			})

		const categoriasDespesas = despesasMes.reduce<Record<string, number>>((acc, item) => {
			const key = String(item.categoria || 'outros').toLowerCase()
			acc[key] = (acc[key] || 0) + toNumber(item.valor)
			return acc
		}, {})

		const despesasPorCategoriaChart = Object.entries(categoriasDespesas)
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value)

		const top5Custos = [...despesasMes]
			.sort((a, b) => toNumber(b.valor) - toNumber(a.valor))
			.slice(0, 5)

		const lojaMap = new Map(lojas.map((item) => [item.id, item.nome_fantasia]))
		const clienteMap = new Map(clientes.map((item) => [item.id, item.nome]))
		const produtoMap = new Map(produtos.map((item) => [item.id, item.nome]))

		const despesasPorServicoMap = despesasMes.reduce<Record<string, number>>((acc, item) => {
			if (!item.servico_id) return acc
			acc[item.servico_id] = (acc[item.servico_id] || 0) + toNumber(item.valor)
			return acc
		}, {})

		const pagamentosPorServicoMap = pagamentos.reduce<Record<string, number>>((acc, pagamento) => {
			if (!pagamento.servico_id) return acc

			const dataPgto = parseDateOnlyToLocal(pagamento.data_pagamento)
			const dataVenc = parseDateOnlyToLocal(pagamento.data_vencimento)
			const noMes = inSameMonth(dataPgto, mesSelecionado) || inSameMonth(dataVenc, mesSelecionado)
			if (!noMes) return acc

			const valorPagamento = toNumber(pagamento.valor_pago) > 0 ? toNumber(pagamento.valor_pago) : toNumber(pagamento.valor)
			acc[pagamento.servico_id] = (acc[pagamento.servico_id] || 0) + valorPagamento
			return acc
		}, {})

		const porLojaClienteMap = servicosMes.reduce<Record<string, {
			id: string
			nome: string
			tipo: 'loja' | 'particular'
			os: number
			receita: number
			custo: number
			lucro: number
		}>>((acc, servico) => {
			const tipo = servico.tipo_cliente === 'particular' ? 'particular' : 'loja'
			const id = tipo === 'loja' ? String(servico.loja_id || 'sem-loja') : String(servico.cliente_particular_id || 'sem-cliente')
			const nome = tipo === 'loja'
				? (lojaMap.get(id) || servico.Loja?.nome_fantasia || 'Loja não identificada')
				: (clienteMap.get(id) || servico.ClienteParticular?.nome || 'Cliente não identificado')

			const key = `${tipo}:${id}`
			if (!acc[key]) {
				acc[key] = { id, nome, tipo, os: 0, receita: 0, custo: 0, lucro: 0 }
			}

			const receitaServico = toNumber(servico.valor_total_repasse) || toNumber(servico.valor_total)
			const custoServico = (despesasPorServicoMap[servico.id] || 0) + (pagamentosPorServicoMap[servico.id] || 0)

			acc[key].os += 1
			acc[key].receita += receitaServico
			acc[key].custo += custoServico
			acc[key].lucro += receitaServico - custoServico

			return acc
		}, {})

		const relatorioLojaCliente = Object.values(porLojaClienteMap)
			.sort((a, b) => b.receita - a.receita)

		const porProdutoMap = servicoProdutosMes.reduce<Record<string, {
			id: string
			nome: string
			quantidade: number
			valor: number
			osSet: Set<string>
		}>>((acc, item) => {
			const id = String(item.produto_id || 'sem-produto')
			if (!acc[id]) {
				acc[id] = {
					id,
					nome: item.Produto?.nome || produtoMap.get(id) || 'Produto não identificado',
					quantidade: 0,
					valor: 0,
					osSet: new Set<string>(),
				}
			}

			acc[id].quantidade += toNumber(item.quantidade)
			acc[id].valor += toNumber(item.valor_total)
			acc[id].osSet.add(String(item.servico_id))

			return acc
		}, {})

		const relatorioProdutos = Object.values(porProdutoMap)
			.map((item) => ({
				id: item.id,
				nome: item.nome,
				quantidade: item.quantidade,
				valor: item.valor,
				os: item.osSet.size,
			}))
			.sort((a, b) => b.valor - a.valor)

		const mesesConsolidados = Array.from({ length: 6 }).map((_, idx) => {
			const ref = new Date(mesSelecionado.getFullYear(), mesSelecionado.getMonth() - (5 - idx), 1)
			const key = `${ref.getFullYear()}-${ref.getMonth()}`
			const label = ref.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })

			const receitaMes = servicos
				.filter((item) => {
					const dt = parseDateOnlyToLocal(item.data_servico)
					return !!dt && `${dt.getFullYear()}-${dt.getMonth()}` === key && ['concluido', 'concluida'].includes((item.status || '').toLowerCase())
				})
				.reduce((acc, item) => acc + (toNumber(item.valor_total_repasse) || toNumber(item.valor_total)), 0)

			const despesaMes = despesas
				.filter((item) => {
					const dt = parseDateOnlyToLocal(item.data_despesa)
					return !!dt && `${dt.getFullYear()}-${dt.getMonth()}` === key
				})
				.reduce((acc, item) => acc + toNumber(item.valor), 0)

			return {
				name: label,
				receita: receitaMes,
				despesa: despesaMes,
				lucro: receitaMes - despesaMes,
			}
		})

		return {
			receitaTotal,
			lucroLiquido,
			totalDespesasMes,
			custoFolhaPaga,
			custoFolhaPrevista,
			custoTotalRealizado,
			servicosTotal,
			servicosConcluidos,
			servicosCancelados,
			ticketMedio,
			custoPorServico,
			custoPorOS,
			valorMedioPorDia,
			projecaoMesBaseAnterior,
			receitaMesAnterior,
			margemContribuicao,
			taxaCancelamento,
			producaoPorDia,
			despesasPorCategoriaChart,
			top5Custos,
			relatorioLojaCliente,
			relatorioProdutos,
			mesesConsolidados,
			pendenteReceber: toNumber(dashboard.financeiro.pendentes),
			margemLucro: toNumber(dashboard.financeiro.margemLucro),
			receitaLojas: toNumber(dashboard.financeiro.receitaLojas),
			receitaParticulares: toNumber(dashboard.financeiro.receitaParticulares),
		}
	}, [dashboard, dashboardAnterior, despesas, servicos, pagamentos, servicoProdutosMes, lojas, clientes, produtos, mesSelecionado, mesAtual])

	if (loading) {
		return (
			<div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<p className="text-sm text-muted-foreground">Gerando relatórios...</p>
			</div>
		)
	}

	if (erro || !dashboard || !analytics) {
		return (
			<div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3">
				<AlertTriangle className="h-10 w-10 text-destructive" />
				<p className="font-medium text-destructive">{erro || 'Falha ao montar os relatórios.'}</p>
				<Button variant="outline" onClick={() => window.location.reload()}>Tentar novamente</Button>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
					<p className="text-muted-foreground">Análises de custo, lucro, produção e desempenho operacional.</p>
				</div>

				<div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card p-1">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => setMesSelecionado((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
						aria-label="Ver mes anterior"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<div className="flex min-w-[170px] items-center justify-center gap-2 px-2 text-sm font-medium capitalize">
						<CalendarDays className="h-4 w-4 text-muted-foreground" />
						<span>{tituloMesSelecionado}</span>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => setMesSelecionado((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
						disabled={!podeAvancarMes}
						aria-label="Ver proximo mes"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-muted-foreground">Receita do Mês</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{analytics.receitaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
						<p className="mt-1 text-xs text-muted-foreground">Lojas + particulares</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-muted-foreground">Custos Realizados</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-destructive">{analytics.custoTotalRealizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
						<p className="mt-1 text-xs text-muted-foreground">Despesas + folha paga</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-muted-foreground">Lucro Líquido</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-primary">{analytics.lucroLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
						<p className="mt-1 text-xs text-muted-foreground">Margem {analytics.margemLucro.toFixed(2)}%</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-muted-foreground">Custo por OS</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{analytics.custoPorOS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
						<p className="mt-1 text-xs text-muted-foreground">Custo médio por OS concluída</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-muted-foreground">Valor Médio por Dia</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{analytics.valorMedioPorDia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
						<p className="mt-1 text-xs text-muted-foreground">Receita média diária no mês</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-muted-foreground">Projeção do Mês</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-chart-3">{analytics.projecaoMesBaseAnterior.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
						<p className="mt-1 text-xs text-muted-foreground">Baseada no mês anterior</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="geral" className="w-full">
				<TabsList className="grid h-auto w-full grid-cols-2 gap-2 p-1 sm:grid-cols-7">
					<TabsTrigger value="geral" className="gap-2"><BarChart3 className="h-4 w-4" />Geral</TabsTrigger>
					<TabsTrigger value="custos" className="gap-2"><Receipt className="h-4 w-4" />Custos</TabsTrigger>
					<TabsTrigger value="lucro" className="gap-2"><Wallet className="h-4 w-4" />Lucro</TabsTrigger>
					<TabsTrigger value="producao" className="gap-2"><Hammer className="h-4 w-4" />Produção</TabsTrigger>
					<TabsTrigger value="mensal" className="gap-2"><CalendarDays className="h-4 w-4" />Mensal Total</TabsTrigger>
					<TabsTrigger value="loja-cliente" className="gap-2"><Building2 className="h-4 w-4" />Loja/Cliente</TabsTrigger>
					<TabsTrigger value="produto" className="gap-2"><Package className="h-4 w-4" />Produto</TabsTrigger>
				</TabsList>

				<TabsContent value="geral" className="mt-4 space-y-4">
					<div className="grid gap-4 lg:grid-cols-2">
						<DonutChart
							data={analytics.despesasPorCategoriaChart}
							title="Distribuição de Custos"
							description="Despesas agrupadas por categoria no período"
						/>
						<TrendAreaChart
							data={analytics.producaoPorDia.length > 0 ? analytics.producaoPorDia : [{ name: 'Sem dados', value: 0 }]}
							title="Produção por Dia"
							description="Quantidade de OS por dia do mês"
						/>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Ticket Médio</CardTitle></CardHeader>
							<CardContent><p className="text-xl font-bold">{analytics.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Custo por Serviço</CardTitle></CardHeader>
							<CardContent><p className="text-xl font-bold text-destructive">{analytics.custoPorServico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Margem de Contribuição</CardTitle></CardHeader>
							<CardContent><p className="text-xl font-bold text-primary">{analytics.margemContribuicao.toFixed(2)}%</p></CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Taxa de Cancelamento</CardTitle></CardHeader>
							<CardContent><p className="text-xl font-bold">{analytics.taxaCancelamento.toFixed(2)}%</p></CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="custos" className="mt-4 space-y-4">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Despesas Operacionais</CardTitle></CardHeader>
							<CardContent><p className="text-2xl font-bold text-destructive">{analytics.totalDespesasMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Folha Paga</CardTitle></CardHeader>
							<CardContent><p className="text-2xl font-bold">{analytics.custoFolhaPaga.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Folha Prevista</CardTitle></CardHeader>
							<CardContent><p className="text-2xl font-bold text-chart-3">{analytics.custoFolhaPrevista.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Top 5 Maiores Despesas</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{analytics.top5Custos.length === 0 ? (
								<p className="text-sm text-muted-foreground">Sem despesas registradas no período selecionado.</p>
							) : (
								analytics.top5Custos.map((item) => (
									<div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
										<div className="flex flex-col">
											<span className="text-sm font-medium">{item.descricao}</span>
											<span className="text-xs text-muted-foreground">{String(item.categoria || 'outros')}</span>
										</div>
										<span className="font-mono font-bold text-destructive">{toNumber(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
									</div>
								))
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="lucro" className="mt-4 space-y-4">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Lucro Líquido</CardTitle></CardHeader>
							<CardContent className="flex items-end justify-between">
								<p className="text-2xl font-bold text-primary">{analytics.lucroLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
								<TrendingUp className="h-5 w-5 text-primary" />
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Receita Lojas</CardTitle></CardHeader>
							<CardContent><p className="text-2xl font-bold">{analytics.receitaLojas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Receita Particulares</CardTitle></CardHeader>
							<CardContent><p className="text-2xl font-bold">{analytics.receitaParticulares.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">A Receber</CardTitle></CardHeader>
							<CardContent className="flex items-end justify-between">
								<p className="text-2xl font-bold text-chart-3">{analytics.pendenteReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
								<TrendingDown className="h-5 w-5 text-chart-3" />
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Saúde Financeira do Mês</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Margem de lucro</span>
								<Badge variant="outline">{analytics.margemLucro.toFixed(2)}%</Badge>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Margem de contribuição</span>
								<Badge variant="outline">{analytics.margemContribuicao.toFixed(2)}%</Badge>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Lucro líquido / custo total</span>
								<Badge variant="outline">
									{analytics.custoTotalRealizado > 0 ? `${(analytics.lucroLiquido / analytics.custoTotalRealizado * 100).toFixed(2)}%` : '0.00%'}
								</Badge>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="producao" className="mt-4 space-y-4">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Serviços Totais</CardTitle></CardHeader>
							<CardContent><p className="text-2xl font-bold">{analytics.servicosTotal}</p></CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Concluídos</CardTitle></CardHeader>
							<CardContent><p className="text-2xl font-bold text-primary">{analytics.servicosConcluidos}</p></CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Cancelados</CardTitle></CardHeader>
							<CardContent><p className="text-2xl font-bold text-destructive">{analytics.servicosCancelados}</p></CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Eficiência</CardTitle></CardHeader>
							<CardContent className="flex items-center justify-between">
								<p className="text-2xl font-bold">{analytics.servicosTotal > 0 ? ((analytics.servicosConcluidos / analytics.servicosTotal) * 100).toFixed(2) : '0.00'}%</p>
								<Target className="h-5 w-5 text-primary" />
							</CardContent>
						</Card>
					</div>

					<TrendAreaChart
						data={analytics.producaoPorDia.length > 0 ? analytics.producaoPorDia : [{ name: 'Sem dados', value: 0 }]}
						title="Curva de Produção"
						description="Evolução diária de OS executadas no mês"
					/>
				</TabsContent>

				<TabsContent value="mensal" className="mt-4 space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Consolidado Mensal (Últimos 6 meses)</CardTitle>
						</CardHeader>
						<CardContent>
							<TrendAreaChart
								data={analytics.mesesConsolidados.map((item) => ({ name: item.name, value: item.receita }))}
								title="Receita Mensal"
								description="Evolução consolidada de receita"
							/>
						</CardContent>
					</Card>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Mês Atual</CardTitle></CardHeader>
							<CardContent><p className="text-xl font-bold">{analytics.receitaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Mês Anterior</CardTitle></CardHeader>
							<CardContent><p className="text-xl font-bold">{analytics.receitaMesAnterior.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Variação</CardTitle></CardHeader>
							<CardContent>
								<p className="text-xl font-bold">
									{analytics.receitaMesAnterior > 0
										? `${(((analytics.receitaTotal - analytics.receitaMesAnterior) / analytics.receitaMesAnterior) * 100).toFixed(2)}%`
										: '0.00%'}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Projeção</CardTitle></CardHeader>
							<CardContent><p className="text-xl font-bold text-chart-3">{analytics.projecaoMesBaseAnterior.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="loja-cliente" className="mt-4 space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Relatório por Loja/Cliente</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{analytics.relatorioLojaCliente.length === 0 ? (
								<p className="text-sm text-muted-foreground">Sem dados de loja/cliente no período.</p>
							) : (
								analytics.relatorioLojaCliente.map((item) => (
									<div key={`${item.tipo}-${item.id}`} className="flex items-center justify-between rounded-lg border p-3">
										<div>
											<p className="text-sm font-semibold">{item.nome}</p>
											<div className="mt-1 flex items-center gap-2">
												<Badge variant="outline" className="text-[10px] uppercase">
													{item.tipo === 'loja' ? 'Loja' : 'Cliente'}
												</Badge>
												<Badge variant="outline" className="text-[10px]">{item.os} OS</Badge>
											</div>
										</div>
										<div className="text-right text-xs">
											<p className="font-medium">Receita: {item.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
											<p className="text-muted-foreground">Custo: {item.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
											<p className="font-bold text-primary">Lucro: {item.lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
										</div>
									</div>
								))
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="produto" className="mt-4 space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Relatório por Produto</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{analytics.relatorioProdutos.length === 0 ? (
								<p className="text-sm text-muted-foreground">Sem dados de produtos no período.</p>
							) : (
								analytics.relatorioProdutos.map((item) => (
									<div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
										<div>
											<p className="text-sm font-semibold">{item.nome}</p>
											<p className="text-xs text-muted-foreground">{item.os} OS com este produto</p>
										</div>
										<div className="text-right text-xs">
											<p className="font-medium">Qtd: {item.quantidade}</p>
											<p className="font-bold text-primary">{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
										</div>
									</div>
								))
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
