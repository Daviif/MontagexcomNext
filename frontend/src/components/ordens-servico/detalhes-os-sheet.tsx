'use client'
import { useState, useEffect } from 'react'
import {
  MapPin,
  Calendar,
  User,
  Building2,
  Package,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Hash,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'
import type { lojas, clientes_particulares, OrdemServico } from '@/lib/types'

interface DetalhesOSSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  os: OrdemServico | null
}

const statusColors: Record<string, string> = {
  agendada: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  em_andamento: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  concluido: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  cancelada: 'bg-destructive/10 text-destructive border-destructive/20',
  pendente: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
}

const statusLabels: Record<string, string> = {
  agendada: 'Agendada',
  em_andamento: 'Em Andamento',
  concluido: 'Concluída',
  cancelada: 'Cancelada',
  pendente: 'Pendente',
}

const prioridadeColors: Record<string, string> = {
  baixa: 'bg-muted text-muted-foreground border-muted',
  normal: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  alta: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  urgente: 'bg-destructive/10 text-destructive border-destructive/20',
}

export function DetalhesOSSheet({ open, onOpenChange, os }: DetalhesOSSheetProps) {

  const [detalhes, setDetalhes] = useState<OrdemServico | null>(null);
  const [cliente, setCliente] = useState<lojas | clientes_particulares | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchDetalhesOS() {
      if (!os || !open) return;
      setLoading(true);
      try {
        // Busca detalhes completos da OS (inclui produtos e montadores)
        const res = await api.get(`/servicos/${os.id}`);
        const sm = await api.get(`/servico_montadores/${os.id}`);
        const sp = await api.get(`/servico_produtos/${os.id}`);
        
        const detalhesCompletos = {
          ...res.data?.data ?? res.data,
          montadores: sm.data?.data ?? sm.data,
          ServicoProdutos: sp.data?.data ?? sp.data,
        }
        setDetalhes(detalhesCompletos);
      
        // Busca dados do cliente vinculado
        const rota = res.data?.data?.tipo_cliente === 'loja'
          ? `/lojas/${res.data?.data?.loja_id}`
          : `/clientes_particulares/${os.cliente_particular_id}`;
        const clienteRes = await api.get(rota);
        setCliente(clienteRes.data?.data ?? clienteRes.data);

        console.log('Buscando detalhes da OS:', os);
        console.log('Resposta da API:', res.data);
      } catch (err) {
        console.error('Erro ao buscar detalhes da OS:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetalhesOS();
  }, [os, open]);

  if (!os) return null;
  const dados = detalhes || os;
  const isLoja = dados.tipo_cliente === 'loja';

  if (loading) {
        return (
          <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando detalhes...</p>
          </div>
        )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <SheetTitle className="font-mono text-xl">
                {dados.codigo_os_loja || dados.id.slice(0, 8).toUpperCase()}
              </SheetTitle>
            </div>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className={cn(statusColors[os.status])}>
                {statusLabels[os.status]}
              </Badge>
              <Badge variant="outline" className={cn(prioridadeColors[os.prioridade])}>
                {os.prioridade.toUpperCase()}
              </Badge>
            </div>
          </div>
          <SheetDescription className="pt-2">
            Detalhes da operação Montagex
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] pr-4 pl-4">
          <div className="mt-6 flex flex-col gap-6 pb-10">
            
            {/* Informações do Cliente */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                {isLoja ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                Dados do Cliente
              </h3>
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Nome / Razão Social</p>
                  <p className="font-medium">
                    {os.Loja?.nome_fantasia || os.ClienteParticular?.nome || 'Não identificado'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Contato
                    </p>
                    <p className="text-sm">{cliente?.telefone || os.Loja?.telefone || os.ClienteParticular?.telefone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> E-mail
                    </p>
                    <p className="text-sm truncate">{cliente?.email || os.Loja?.email || os.ClienteParticular?.email || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MapPin className="h-4 w-4" />
                Local de Execução
              </h3>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm leading-relaxed">
                  {typeof os.endereco_execucao === 'string'
                    ? os.endereco_execucao
                    : `${os.endereco_execucao?.logradouro}, ${os.endereco_execucao?.numero} - ${os.endereco_execucao?.bairro}, ${os.endereco_execucao?.cidade}/${os.endereco_execucao?.estado}`}
                </p>
              </div>
            </div>

            {/* Agendamento */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="h-4 w-4" />
                Agendamento
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Data</p>
                  <p className="text-sm font-medium">
                    {new Date(os.data_servico).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Janela de Horário</p>
                  <p className="text-sm font-medium">
                    {os.janela_inicio} às {os.janela_fim}
                  </p>
                </div>
              </div>
            </div>

            {/* Equipe de Montagem */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4" />
                Montadores Escalados
              </h3>
              <div className="flex flex-wrap gap-2">
                {dados.montadores && dados.montadores.length > 0 ? (
                  dados.montadores.map((m) => (
                    <Badge key={m.id} variant="secondary" className="px-3 py-1">               
                      {m.Usuario?.nome || m.nome || 'Montador'}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">Nenhum montador vinculado</p>
                )}
              </div>
            </div>

            {/* Produtos */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Package className="h-4 w-4" />
                Produtos do Serviço
              </h3>
              <div className="space-y-2">
                {dados.ServicoProdutos?.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{p.Produto.nome || p.nome || 'Produto'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.quantidade} unidade(s) x R$ {Number(p.valor_unitario).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <p className="text-sm font-bold">
                      R$ {(p.quantidade * p.valor_unitario).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Observações */}
            {os.observacoes && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  Observações Internas
                </h3>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground italic">`{os.observacoes}`</p>
                </div>
              </div>
            )}

            <Separator />

            {/* Resumo Financeiro */}
            <div className="flex items-center justify-between p-2">
              <div>
                <p className="text-sm text-muted-foreground font-medium text-blue-500">Valor Total da OS</p>
                <p className="text-3xl font-bold tracking-tighter">
                  R$ {Number(os.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <CheckCircle2 className={cn("h-10 w-10", os.status === 'concluida' ? 'text-emerald-500' : 'text-muted/20')} />
            </div>

            {/* Botões de Ação Contextuais */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button variant="outline" className="w-full">Editar OS</Button>
              {os.status === 'agendada' && <Button className="w-full">Iniciar Montagem</Button>}
              {os.status === 'em_andamento' && <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Finalizar OS</Button>}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}