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
import { lojas, pagamentos_funcionarios, pagamentos_funcionarios_baixas, Usuario } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BaixaPagamentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loja: lojas | null
  pagamentos: pagamentos_funcionarios[]
  baixas: pagamentos_funcionarios_baixas[]
  usuarios: Usuario[]
  onSuccess?: () => void
}

export function BaixaPagamentoDialog({ 
  open, 
  onOpenChange, 
  loja, 
  pagamentos, 
  baixas, 
  usuarios,
  onSuccess 
}: BaixaPagamentoDialogProps) {
  const [pagamentoSelecionadoId, setPagamentoSelecionadoId] = useState<string>('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [forma, setForma] = useState('PIX')
  const [obs, setObs] = useState('')
  const [loading, setLoading] = useState(false)

  // Resetar campos ao abrir/fechar
  useEffect(() => {
    if (open) {
      setPagamentoSelecionadoId('')
      setValor('')
      setObs('')
      setData(new Date().toISOString().split('T')[0])
    }
  }, [open])

  // Lógica de Pendências: Cruza pagamentos com baixas
  const pendencias = useMemo(() => {
    if (!loja || !pagamentos.length){
        //console.log("Dialog sem dados:", { loja: !!loja, pagtos: pagamentos.length });
        return []
    } 

    const resultado = pagamentos
    .map(p => {
        const totalBaixado = baixas
            .filter(b => b.pagamento_funcionario_id === p.id)
            .reduce((acc, b) => acc + Number(b.valor || 0), 0)

            const valorOriginal = Number(p.valor || 0);
            const saldo = valorOriginal - totalBaixado;
            const montador = usuarios.find(u => u.id === p.usuario_id);

            return {
                ...p,
                saldo: Number(saldo.toFixed(2)),
                montadorNome: montador?.nome || 'Montador não identificado'
            };
    })
    .filter(p => p.saldo > 0.01) // Filtra apenas os que têm saldo pendente
    //console.log("Pendências calculadas:", resultado)
    return resultado

  }, [loja, pagamentos, baixas, usuarios])

  //console.log('Pendencias filtradas:', pendencias)

  const valorMaximo = useMemo(() => {
    const selecionado = pendencias.find(p => p.id === pagamentoSelecionadoId)
    return selecionado ? selecionado.saldo : 0
  }, [pagamentoSelecionadoId, pendencias])

  const handleBaixa = async () => {
    if (!pagamentoSelecionadoId || !valor) return
    
    setLoading(true)
    try {
      // Rota correta conforme seu backend
      await api.post(`/pagamentos_funcionarios/${pagamentoSelecionadoId}/baixas`, {
        valor: Number(valor),
        data_pagamento: data,
        forma_pagamento: forma,
        observacoes: obs
      })
      
      toast.success('Baixa registrada com sucesso!')
      if (onSuccess) onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.error || 'Erro ao registrar baixa')
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
                {pendencias.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[140px] text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">Não há serviços pendentes para esta loja.</p>
                  </div>
                ) : (
                  pendencias.map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setPagamentoSelecionadoId(p.id)
                        setValor(p.saldo.toFixed(2))
                      }}
                      className={cn(
                        "flex flex-col p-3 rounded-lg border cursor-pointer transition-all hover:border-primary",
                        pagamentoSelecionadoId === p.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{p.montadorNome}</span>
                        </div>
                        <Badge variant={pagamentoSelecionadoId === p.id ? "default" : "outline"} className="font-mono">
                          Pendente: R$ {p.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Data OS: {new Date(p.data_pagamento).toLocaleDateString('pt-BR')}
                      </p>
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
                  disabled={!pagamentoSelecionadoId}
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
            disabled={loading || !pagamentoSelecionadoId || !valor || Number(valor) <= 0 || Number(valor) > valorMaximo + 0.01}
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