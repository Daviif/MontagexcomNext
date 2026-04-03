'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Search, 
  ChevronRight,  
  Bug, 
  Loader2,
  Users
} from 'lucide-react'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DashboardSalariosResponse } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export default function SalariosTab() {
  const [loading, setLoading] = useState(true)
  const [salariosData, setSalariosData] = useState<DashboardSalariosResponse | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debugMode, setDebugMode] = useState(false)
  const [expandedMontadores, setExpandedMontadores] = useState<Set<string>>(new Set())

  // Busca os dados centralizados no backend
  useEffect(() => {
    async function fetchSalarios() {
      try {
        setLoading(true)
        const res = await api.get(`/dashboard/salarios${debugMode ? '?debug=1' : ''}`)
        setSalariosData(res.data?.data ?? res.data)
      } catch (error) {
        console.error("Erro ao buscar cálculos salariais:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSalarios()
  }, [debugMode])

  const formatCurrency = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // Filtro de busca por nome de montador
  const filteredMontadores = useMemo(() => {
    const list = salariosData?.montadores || []
    if (!searchTerm) return list
    return list.filter((m) => 
      m.nome.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [salariosData, searchTerm])

    if (loading) return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )

  if (!salariosData) return <div className="p-10 text-center">Nenhum dado salarial disponível.</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Barra de Busca Superior */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar montador..."
          className="pl-9 bg-background border-none shadow-sm h-11"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-background px-6 py-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            Salários - {new Date(salariosData.periodo.inicio).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[10px] font-bold">
              100% do valor
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDebugMode(!debugMode)}
              className={cn("h-8 text-xs gap-1.5", debugMode && "bg-primary text-primary-foreground border-primary")}
            >
              <Bug className="h-3.5 w-3.5" />
              {debugMode ? "Debug Ativo" : "Modo Debug"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Banner de Totais */}
          <div className="bg-primary/5 p-6 border-b">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Total a pagar</span>
              <div className="text-3xl font-black text-foreground leading-tight">
                {formatCurrency(salariosData?.totais?.total_salarios || 0)}
              </div>
              <div className="text-xs text-muted-foreground">
                Cheio: {formatCurrency(salariosData?.totais?.total_valor_montagens || 0)} · 
                Calculado: {formatCurrency(salariosData?.totais?.total_montadores || 0)}
              </div>
            </div>
          </div>

          {/* Lista de Montadores (Estilo Accordion) */}
          <div className="divide-y divide-border/40">
            {filteredMontadores.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground italic">Nenhum serviço concluído este mês</div>
            ) : (
              filteredMontadores.map((montador) => {
                const isExpanded = expandedMontadores.has(montador.id)
                return (
                  <div key={montador.id}>
                    <button
                      onClick={() => {
                        const next = new Set(expandedMontadores)
                        if (isExpanded) next.delete(montador.id)
                        else next.add(montador.id)
                        setExpandedMontadores(next)
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors px-6"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("transition-transform", isExpanded && "rotate-90")}>
                           <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <Users className="h-4 w-4 text-primary/60" />
                        <span className="font-bold text-foreground">{montador.nome}</span>
                      </div>
                      <span className="font-mono font-bold text-primary">{formatCurrency(montador.salario_calculado || 0)}</span>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 animate-in slide-in-from-top-1 duration-200">
                        <div className="rounded-lg border bg-background overflow-hidden shadow-sm">
                          <Table>
                            <TableHeader className="bg-muted/40">
                              <TableRow>
                                <TableHead className="text-[10px] uppercase font-bold">Data</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold">Nº OS</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold text-right">Calculado</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold text-right text-primary">Vlr. Montador</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {montador.detalhes?.map((item, idx: number) => (
                                <React.Fragment key={idx}>
                                  <TableRow className="border-border/40">
                                    <TableCell className="text-[11px] font-medium">{new Date(item.data_servico).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell className="text-[11px] font-mono text-muted-foreground">{item.codigo_os_loja || 'OS-' + item.servico_id.slice(0,5)}</TableCell>
                                    <TableCell className="text-[11px] text-right">{formatCurrency(item.valor_calculado)}</TableCell>
                                    <TableCell className="text-[11px] text-right font-bold text-primary">{formatCurrency(item.valor_atribuido)}</TableCell>
                                  </TableRow>
                                  
                                  {/* Modo Debug: Exibindo a Lógica das 4 Etapas */}
                                  {debugMode && item._debug && (
                                    <TableRow className="bg-amber-500/[0.03]">
                                      <TableCell colSpan={4} className="p-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] font-mono text-amber-800 uppercase">
                                          <div className="border-b border-amber-200/50 pb-1">
                                            <strong>E1 Valor Base:</strong> {item._debug.etapa1_fonte} (Base: {formatCurrency(Number(item._debug.etapa1_valor_base))})
                                          </div>
                                          <div className="border-b border-amber-200/50 pb-1">
                                            <strong>E2 Ajuste Cliente:</strong> {item._debug.etapa2_metodo} ({item._debug.etapa2_formula})
                                          </div>
                                          <div className="border-b border-amber-200/50 pb-1">
                                            <strong>E3 Divisão Equipe:</strong> {item._debug.etapa3_formula || "INDIVIDUAL"}
                                          </div>
                                          <div className="bg-amber-100/50 px-1 rounded flex justify-between">
                                            <strong>E4 RESULTADO FINAL:</strong>
                                            <span className="font-black">{formatCurrency(Number(item._debug.etapa4_valor_final))}</span>
                                          </div>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </React.Fragment>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}