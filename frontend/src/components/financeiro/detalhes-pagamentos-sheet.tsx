'use client'

import { useMemo, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Building2, 
  CalendarDays, 
  ChevronDown, 
  ChevronRight
} from 'lucide-react'
import { lojas, OrdemServico, pagamentos_funcionarios, pagamentos_funcionarios_baixas, Usuario } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DetalhesPagamentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loja: lojas
  servicosDaLoja: OrdemServico[]
  baixasDaLoja: pagamentos_funcionarios_baixas[]
  pagamentosDaLoja: pagamentos_funcionarios[]
  usuarios: Usuario[]
}

export function DetalhesPagamentSheet({
  open,
  onOpenChange,
  loja,
  servicosDaLoja, 
  baixasDaLoja,
  pagamentosDaLoja,
  usuarios,
}: DetalhesPagamentSheetProps) {
  const toNumber = (value: unknown) => {
    const parsed = Number(value ?? 0)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const formatDateOnlyBR = (value: Date | string) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number)
      return new Date(year, month - 1, day).toLocaleDateString('pt-BR')
    }

    return new Date(value).toLocaleDateString('pt-BR')
  }

  const { totalDividaOS, totalPagoBaixas, totalSaldo, hierarquia } = useMemo(() => {
    const servicosDaLojaIds = new Set(servicosDaLoja.map((servico) => servico.id))
    const pagamentosPorId = new Map(pagamentosDaLoja.map((pagamento) => [pagamento.id, pagamento]))
    const usuariosPorId = new Map(usuarios.map((usuario) => [usuario.id, usuario]))

    const baixasPorServicoMontador = baixasDaLoja.reduce<Record<string, number>>((acc, baixa) => {
      const pagamento = pagamentosPorId.get(baixa.pagamento_funcionario_id)
      if (!pagamento || !servicosDaLojaIds.has(pagamento.servico_id)) {
        return acc
      }

      const chave = `${pagamento.servico_id}::${pagamento.usuario_id}`
      acc[chave] = (acc[chave] || 0) + toNumber(baixa.valor)
      return acc
    }, {})

    const agrupadoPorMontador = new Map<
      string,
      {
        id: string
        nome: string
        totalSaldo: number
        itens: {
          id: string
          numeroOS: string
          valorPrevisto: number
          valorPago: number
          status: 'pago' | 'pendente'
        }[]
      }
    >()

    servicosDaLoja.forEach((servico) => {
      const montadoresRaw = Array.isArray(servico.servico_montadores) && servico.servico_montadores.length > 0
        ? servico.servico_montadores
        : (Array.isArray(servico.montadores) ? servico.montadores : [])

      if (montadoresRaw.length === 0) return

      const valorBaseServico = toNumber(servico.valor_total_repasse) || toNumber(servico.valor_total)
      const valorFallbackPorMontador = montadoresRaw.length > 0 ? valorBaseServico / montadoresRaw.length : 0

      montadoresRaw.forEach((registroMontador) => {
        const montadorComUsuario = registroMontador as unknown as {
          id?: string
          usuario_id?: string
          usuario?: { id?: string; nome?: string } | null
          valor_atribuido?: number | string
          percentual_divisao?: number | string
          nome?: string
        }

        const usuarioId =
          montadorComUsuario.usuario_id ||
          montadorComUsuario.usuario?.id ||
          montadorComUsuario.id

        if (!usuarioId) return

        const valorAtribuido = toNumber(montadorComUsuario.valor_atribuido)
        const percentualDivisao = toNumber(montadorComUsuario.percentual_divisao)

        const valorPrevisto =
          valorAtribuido > 0
            ? valorAtribuido
            : percentualDivisao > 0
              ? (valorBaseServico * percentualDivisao) / 100
              : valorFallbackPorMontador

        const chaveBaixa = `${servico.id}::${usuarioId}`
        const valorPago = toNumber(baixasPorServicoMontador[chaveBaixa])
        const saldo = Math.max(valorPrevisto - valorPago, 0)
        const status = valorPrevisto <= 0 || saldo <= 0.009 ? 'pago' : 'pendente'

        if (!agrupadoPorMontador.has(usuarioId)) {
          const usuario = usuariosPorId.get(usuarioId)
          agrupadoPorMontador.set(usuarioId, {
            id: usuarioId,
            nome: usuario?.nome || montadorComUsuario.usuario?.nome || montadorComUsuario.nome || 'Montador',
            totalSaldo: 0,
            itens: [],
          })
        }

        const montador = agrupadoPorMontador.get(usuarioId)
        if (!montador) return

        montador.totalSaldo += saldo
        montador.itens.push({
          id: `${servico.id}-${usuarioId}`,
          numeroOS: servico.codigo_os_loja || servico.id.slice(0, 8),
          valorPrevisto,
          valorPago,
          status,
        })
      })
    })

    const hierarquiaCalculada = Array.from(agrupadoPorMontador.values())
      .map((montador) => ({
        ...montador,
        itens: montador.itens.sort((a, b) => a.numeroOS.localeCompare(b.numeroOS)),
      }))
      .sort((a, b) => b.totalSaldo - a.totalSaldo)

    const totalDivida = hierarquiaCalculada.reduce(
      (acc, montador) =>
        acc + montador.itens.reduce((subtotal, item) => subtotal + item.valorPrevisto, 0),
      0
    )
    const totalPago = hierarquiaCalculada.reduce(
      (acc, montador) =>
        acc + montador.itens.reduce((subtotal, item) => subtotal + item.valorPago, 0),
      0
    )

    return {
      totalDividaOS: totalDivida,
      totalPagoBaixas: totalPago,
      totalSaldo: Math.max(totalDivida - totalPago, 0),
      hierarquia: hierarquiaCalculada,
    }
  }, [servicosDaLoja, pagamentosDaLoja, baixasDaLoja, usuarios])

  // Controle de expansão (Lógica do JSX original adaptada)
  const [expandedMontadores, setExpandedMontadores] = useState<Set<string>>(new Set())

  const toggleMontador = (id: string) => {
    const next = new Set(expandedMontadores)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedMontadores(next)
  }

  if (!loja) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-6">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Extrato de Repasses: {loja.nome_fantasia}
          </SheetTitle>
          <SheetDescription>
            Detalhamento por montador baseado em Ordens de Serviço
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)] pr-4">
          <div className="space-y-6">
            
            {/* CARDS DE RESUMO (Visual Lucide/Tailwind) */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Dívida Total</p>
                <p className="text-sm font-bold">{totalDividaOS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>
              <div className="rounded-lg border bg-primary/5 p-3 text-center border-primary/20">
                <p className="text-[10px] font-bold text-primary uppercase">Total Pago</p>
                <p className="text-sm font-bold text-primary">{totalPagoBaixas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>
              <div className="rounded-lg border bg-orange-500/5 p-3 text-center border-orange-500/20">
                <p className="text-[10px] font-bold text-orange-600 uppercase">Saldo</p>
                <p className="text-sm font-bold text-orange-600">{totalSaldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>
            </div>

            {/* LISTA ESTILO ACORDEÃO MODERNO */}
            <div className="space-y-3">
              {hierarquia.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-10">Nenhuma OS vinculada.</p>
              ) : (
                hierarquia.map((m) => {
                  const isExpanded = expandedMontadores.has(m.id)
                  return (
                    <div key={m.id} className="rounded-xl border bg-card overflow-hidden shadow-sm">
                      <button
                        onClick={() => toggleMontador(m.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          <div className="text-left">
                            <p className="font-bold text-sm">{m.nome}</p>
                            <p className="text-[10px] text-muted-foreground">ID: {m.id.split('-')[0]}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                           <p className="text-xs font-bold text-orange-600">{m.totalSaldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                           <p className="text-[9px] uppercase text-muted-foreground">Pendente</p>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="bg-muted/20 p-4 border-t animate-in fade-in zoom-in duration-200">
                          <table className="w-full text-[11px] text-left">
                            <thead className="text-muted-foreground uppercase text-[9px] border-b">
                              <tr>
                                <th className="pb-2">OS</th>
                                <th className="pb-2 text-right">Devido</th>
                                <th className="pb-2 text-right">Pago</th>
                                <th className="pb-2 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                              {m.itens.map((item) => (
                                <tr key={item.id}>
                                  <td className="py-2 font-medium">{item.numeroOS}</td>
                                  <td className="py-2 text-right font-mono">{item.valorPrevisto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                  <td className="py-2 text-right font-mono text-primary">{item.valorPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                  <td className="py-2 text-center">
                                    <Badge variant="outline" className={cn(
                                      "text-[9px] h-4",
                                      item.status === 'pago' ? "border-primary text-primary" : "border-orange-500 text-orange-600"
                                    )}>
                                      {item.status.toUpperCase()}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            <Separator />

            {/* HISTÓRICO SIMPLES (Lucide) */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                <CalendarDays className="h-4 w-4" /> Histórico de Baixas
              </h4>
              {baixasDaLoja.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhuma baixa registrada.</p>
              ) : (
                <div className="space-y-2">
                  {baixasDaLoja.map(b => {
                    const pgto = pagamentosDaLoja.find(p => p.id === b.pagamento_funcionario_id)
                    const user = usuarios.find(u => u.id === pgto?.usuario_id)
                    return (
                      <div key={b.id} className="flex justify-between items-center p-3 rounded-lg border bg-card text-xs">
                        <div>
                          <p className="font-bold">{user?.nome || 'Montador'}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDateOnlyBR(b.data_pagamento)} • {b.forma_pagamento}</p>
                        </div>
                        <span className="font-mono font-bold text-primary">
                          {Number(b.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}