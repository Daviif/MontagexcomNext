'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Loader2, DollarSign, User, Calendar, CheckCircle2 } from 'lucide-react'
import { api } from '@/services/api'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { lojas, OrdemServico, pagamentos_funcionarios, pagamentos_funcionarios_baixas, Usuario } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BaixaPagamentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loja: lojas | null
  pagamentos: pagamentos_funcionarios[]
  servicosDaLoja: OrdemServico[]
  baixas: pagamentos_funcionarios_baixas[]
  usuarios: Usuario[]
  onSuccess?: () => void
}

interface MontadorServicoRaw {
  id?: string
  usuario_id?: string
  usuario?: { id?: string; nome?: string } | null
  valor_atribuido?: number | string
  percentual_divisao?: number | string
  nome?: string
}

export function BaixaPagamentoDialog({ 
  open, 
  onOpenChange, 
  loja, 
  pagamentos, 
  servicosDaLoja,
  baixas, 
  usuarios,
  onSuccess 
}: BaixaPagamentoDialogProps) {
  const [pendenciaSelecionadaId, setPendenciaSelecionadaId] = useState<string>('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [forma, setForma] = useState('PIX')
  const [obs, setObs] = useState('')
  const [loading, setLoading] = useState(false)

  const toNumber = (value: unknown) => {
    const parsed = Number(value ?? 0)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const formatDateOnlyBR = (value: Date | string | undefined) => {
    if (!value) return '-'

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number)
      return new Date(year, month - 1, day).toLocaleDateString('pt-BR')
    }

    return new Date(value).toLocaleDateString('pt-BR')
  }

  const toDateOnly = (value: Date | string | undefined) => {
    if (!value) {
      const now = new Date()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      return `${now.getFullYear()}-${month}-${day}`
    }

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value
    }

    const parsed = new Date(value)
    const month = String(parsed.getMonth() + 1).padStart(2, '0')
    const day = String(parsed.getDate()).padStart(2, '0')
    return `${parsed.getFullYear()}-${month}-${day}`
  }

  // Resetar campos ao abrir/fechar
  useEffect(() => {
    if (open) {
      setPendenciaSelecionadaId('')
      setValor('')
      setObs('')
      setData(new Date().toISOString().split('T')[0])
    }
  }, [open])

  const pendenciasAgrupadas = useMemo(() => {
    if (!loja || !servicosDaLoja.length) {
      return []
    }

    const pagamentosPorId = new Map(pagamentos.map((pagamento) => [pagamento.id, pagamento]))
    const pagamentosPorServicoMontador = new Map<string, pagamentos_funcionarios>()

    pagamentos.forEach((pagamento) => {
      const key = `${pagamento.servico_id}::${pagamento.usuario_id}`
      if (!pagamentosPorServicoMontador.has(key)) {
        pagamentosPorServicoMontador.set(key, pagamento)
      }
    })

    const servicosDaLojaIds = new Set(servicosDaLoja.map((servico) => servico.id))
    const baixasPorServicoMontador = baixas.reduce<Record<string, number>>((acc, baixa) => {
      const pagamento = pagamentosPorId.get(baixa.pagamento_funcionario_id)
      if (!pagamento || !servicosDaLojaIds.has(pagamento.servico_id)) {
        return acc
      }

      const key = `${pagamento.servico_id}::${pagamento.usuario_id}`
      acc[key] = (acc[key] || 0) + toNumber(baixa.valor)
      return acc
    }, {})

    const porMontador = new Map<string, {
      montadorId: string
      montadorNome: string
      totalSaldo: number
      itens: {
        id: string
        servicoId: string
        montadorId: string
        pagamentoId: string
        numeroOS: string
        dataOS?: Date | string
        saldo: number
        valorOriginal: number
        temLancamento: boolean
        saldoDisponivelBaixa: number
      }[]
    }>()

    servicosDaLoja.forEach((servico) => {
      const montadoresRaw = Array.isArray(servico.servico_montadores) && servico.servico_montadores.length > 0
        ? servico.servico_montadores
        : (Array.isArray(servico.montadores) ? servico.montadores : [])

      if (montadoresRaw.length === 0) return

      const valorBaseServico = toNumber(servico.valor_total_repasse) || toNumber(servico.valor_total)
      const valorFallbackPorMontador = montadoresRaw.length > 0 ? valorBaseServico / montadoresRaw.length : 0

      montadoresRaw.forEach((registro) => {
        const montadorRaw = registro as unknown as MontadorServicoRaw
        const montadorId = montadorRaw.usuario_id || montadorRaw.usuario?.id || montadorRaw.id
        if (!montadorId) return

        const valorAtribuido = toNumber(montadorRaw.valor_atribuido)
        const percentualDivisao = toNumber(montadorRaw.percentual_divisao)
        const valorPrevisto =
          valorAtribuido > 0
            ? valorAtribuido
            : percentualDivisao > 0
              ? (valorBaseServico * percentualDivisao) / 100
              : valorFallbackPorMontador

        const key = `${servico.id}::${montadorId}`
        const valorPago = toNumber(baixasPorServicoMontador[key])
        const saldo = Number(Math.max(valorPrevisto - valorPago, 0).toFixed(2))

        if (saldo <= 0.01) return

        const pagamento = pagamentosPorServicoMontador.get(key)
        const usuario = usuarios.find((item) => item.id === montadorId)

        const saldoDisponivelBaixa = pagamento
          ? Number(Math.max(toNumber(pagamento.valor) - toNumber(pagamento.valor_pago), 0).toFixed(2))
          : saldo

        if (pagamento && saldoDisponivelBaixa <= 0.01) {
          return
        }

        if (!porMontador.has(montadorId)) {
          porMontador.set(montadorId, {
            montadorId,
            montadorNome: usuario?.nome || montadorRaw.usuario?.nome || montadorRaw.nome || 'Montador não identificado',
            totalSaldo: 0,
            itens: [],
          })
        }

        const grupo = porMontador.get(montadorId)
        if (!grupo) return

        grupo.totalSaldo += saldo
        grupo.itens.push({
          id: `${servico.id}-${montadorId}`,
          servicoId: servico.id,
          montadorId,
          pagamentoId: pagamento?.id || '',
          numeroOS: servico.codigo_os_loja || servico.id.slice(0, 8),
          dataOS: servico.data_servico,
          saldo,
          valorOriginal: valorPrevisto,
          temLancamento: !!pagamento,
          saldoDisponivelBaixa,
        })
      })
    })

    return Array.from(porMontador.values())
      .map((grupo) => ({
        ...grupo,
        totalSaldo: Number(grupo.totalSaldo.toFixed(2)),
        itens: grupo.itens.sort((a, b) => a.numeroOS.localeCompare(b.numeroOS)),
      }))
      .sort((a, b) => b.totalSaldo - a.totalSaldo)
  }, [loja, pagamentos, baixas, usuarios, servicosDaLoja])

  const valorMaximo = useMemo(() => {
    const selecionado = pendenciasAgrupadas
      .flatMap((grupo) => grupo.itens)
      .find((item) => item.id === pendenciaSelecionadaId)
    return selecionado ? selecionado.saldoDisponivelBaixa : 0
  }, [pendenciaSelecionadaId, pendenciasAgrupadas])

  const handleBaixa = async () => {
    if (!pendenciaSelecionadaId || !valor) {
      toast.error('Selecione uma OS pendente para registrar a baixa')
      return
    }

    const pendenciaSelecionada = pendenciasAgrupadas
      .flatMap((grupo) => grupo.itens)
      .find((item) => item.id === pendenciaSelecionadaId)

    if (!pendenciaSelecionada) {
      toast.error('Não foi possível identificar a pendência selecionada')
      return
    }
    
    setLoading(true)
    try {
      let pagamentoId = pendenciaSelecionada.pagamentoId

      if (!pagamentoId) {
        const payload = {
          usuario_id: pendenciaSelecionada.montadorId,
          servico_id: pendenciaSelecionada.servicoId,
          valor: Number(pendenciaSelecionada.valorOriginal.toFixed(2)),
          valor_pago: 0,
          status: 'pendente',
          categoria: 'salario',
          origem: 'servico',
          data_vencimento: toDateOnly(pendenciaSelecionada.dataOS),
          observacoes: 'Lançamento criado automaticamente ao registrar baixa no financeiro.',
        }

        const created = await api.post('/pagamentos_funcionarios', payload)
        pagamentoId = created.data?.id || created.data?.data?.id

        if (!pagamentoId) {
          throw new Error('Falha ao criar lançamento financeiro')
        }
      }

      await api.post(`/pagamentos_funcionarios/${pagamentoId}/baixas`, {
        valor: Number(valor),
        data_pagamento: data,
        forma_pagamento: forma,
        observacoes: obs
      })
      
      toast.success('Baixa registrada com sucesso!')
      if (onSuccess) onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      console.error(err)
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : 'Erro ao registrar baixa'

      const detailMessage =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        Array.isArray((err as { response?: { data?: { details?: Array<{ message?: string }> } } }).response?.data?.details)
          ? (err as { response?: { data?: { details?: Array<{ message?: string }> } } }).response?.data?.details?.[0]?.message
          : undefined

      toast.error(detailMessage || message)
    } finally {
      setLoading(false)
    }
  }

  if (!loja) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar Baixa (Pagamento da Loja)</DialogTitle>
          <DialogDescription>
            Registrando recebimento de <span className="font-bold text-foreground">{loja.nome_fantasia}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground font-bold">Serviços Pendentes de Repasse</Label>
            <ScrollArea className="h-[180px] border rounded-md p-2 bg-muted/20">
              <div className="space-y-2">
                {pendenciasAgrupadas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[140px] text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">Não há serviços pendentes para esta loja.</p>
                  </div>
                ) : (
                  pendenciasAgrupadas.map((grupo) => (
                    <div key={grupo.montadorId} className="space-y-2">
                      <div className="flex items-center justify-between rounded-md bg-card border px-3 py-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{grupo.montadorNome}</span>
                        </div>
                        <Badge variant="outline" className="font-mono">
                          Total pendente: R$ {grupo.totalSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </Badge>
                      </div>

                      {grupo.itens.map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => {
                            setPendenciaSelecionadaId(item.id)
                            setValor(item.saldoDisponivelBaixa.toFixed(2))
                          }}
                          className={cn(
                            "flex flex-col p-3 rounded-lg border cursor-pointer transition-all hover:border-primary",
                            pendenciaSelecionadaId === item.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">OS {item.numeroOS}</span>
                            </div>
                            <Badge variant={pendenciaSelecionadaId === item.id ? "default" : "outline"} className="font-mono">
                              Pendente: R$ {item.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Data OS: {formatDateOnlyBR(item.dataOS)}
                          </p>
                          {item.temLancamento && Math.abs(item.saldo - item.saldoDisponivelBaixa) > 0.009 && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Disponível para baixa agora: R$ {item.saldoDisponivelBaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                          {!item.temLancamento && (
                            <p className="text-[10px] text-amber-600 mt-1">Sem lançamento: será criado ao confirmar a baixa</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Valor do Recebimento</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="number" 
                  className="pl-9" 
                  placeholder="0,00" 
                  value={valor} 
                  onChange={e => setValor(e.target.value)} 
                  disabled={!pendenciaSelecionadaId}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={data} onChange={e => setData(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Forma</Label>
            <Select value={forma} onValueChange={setForma}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="TED">Transferência (TED/DOC)</SelectItem>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea 
              placeholder="Ex: Recebido referente a OS do dia..." 
              value={obs} 
              onChange={e => setObs(e.target.value)} 
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            onClick={handleBaixa} 
            disabled={loading || !pendenciaSelecionadaId || !valor || Number(valor) <= 0 || Number(valor) > valorMaximo + 0.01}
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirmar Baixa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={cn("text-sm font-medium leading-none", className)}>{children}</label>
}