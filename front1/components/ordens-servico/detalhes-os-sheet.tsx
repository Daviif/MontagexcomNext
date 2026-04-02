'use client'

import {
  MapPin,
  Calendar,
  Clock,
  User,
  Building2,
  Package,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
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
import { mockLojas, mockClientesParticulares, mockProdutos } from '@/lib/mock-data'
import type { OrdemServico } from '@/lib/types'

interface DetalhesOSSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  os: OrdemServico | null
}

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
  baixa: 'bg-muted text-muted-foreground border-muted',
  normal: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  alta: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  urgente: 'bg-destructive/10 text-destructive border-destructive/20',
}

export function DetalhesOSSheet({ open, onOpenChange, os }: DetalhesOSSheetProps) {
  if (!os) return null

  const getCliente = () => {
    if (os.tipoCliente === 'loja') {
      return mockLojas.find(l => l.id === os.clienteId)
    }
    return mockClientesParticulares.find(c => c.id === os.clienteId)
  }

  const cliente = getCliente()
  const isLoja = os.tipoCliente === 'loja'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {os.numero}
            <Badge variant="outline" className={cn('ml-2', statusColors[os.status])}>
              {statusLabels[os.status]}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Detalhes completos da ordem de servico
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] pr-4">
          <div className="mt-6 flex flex-col gap-6">
            {/* Informacoes do Cliente */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                {isLoja ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                {isLoja ? 'Loja Parceira' : 'Cliente Particular'}
              </h3>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="font-medium">
                  {cliente
                    ? 'nomeFantasia' in cliente
                      ? cliente.nomeFantasia
                      : cliente.nome
                    : 'Cliente nao encontrado'}
                </p>
                {isLoja && (
                  <p className="text-sm text-muted-foreground">
                    {cliente && 'razaoSocial' in cliente ? cliente.razaoSocial : '-'}
                  </p>
                )}
                <div className="mt-2 flex flex-col gap-1">
                  {cliente && 'telefone' in cliente && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {cliente.telefone}
                    </p>
                  )}
                  {cliente && 'email' in cliente && cliente.email && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {cliente.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Endereco de Entrega */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <MapPin className="h-4 w-4" />
                Endereco de Entrega
              </h3>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="font-medium">
                  {os.enderecoEntrega.logradouro}, {os.enderecoEntrega.numero}
                </p>
                {os.enderecoEntrega.complemento && (
                  <p className="text-sm text-muted-foreground">
                    {os.enderecoEntrega.complemento}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {os.enderecoEntrega.bairro} - {os.enderecoEntrega.cidade}/{os.enderecoEntrega.estado}
                </p>
                <p className="text-sm text-muted-foreground">
                  CEP: {os.enderecoEntrega.cep}
                </p>
              </div>
            </div>

            {/* Data e Horario */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Calendar className="h-4 w-4" />
                Agendamento
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {new Date(os.dataAgendada).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                    })}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Horario</p>
                  <p className="font-medium">
                    {os.janelaHorario.inicio} - {os.janelaHorario.fim}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Badge variant="outline" className={cn(prioridadeColors[os.prioridade])}>
                  Prioridade: {os.prioridade}
                </Badge>
              </div>
            </div>

            {/* Produtos */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Package className="h-4 w-4" />
                Produtos ({os.produtos.length})
              </h3>
              <div className="flex flex-col gap-2">
                {os.produtos.map((item) => {
                  const produto = mockProdutos.find(p => p.id === item.produtoId)
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{produto?.nome || 'Produto'}</p>
                        <p className="text-xs text-muted-foreground">
                          Qtd: {item.quantidade} x R$ {item.valorUnitario.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <p className="font-medium">
                        R$ {item.valorTotal.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Montadores */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <User className="h-4 w-4" />
                Montadores ({os.montadores.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {os.montadores.map((montador) => (
                  <Badge key={montador.id} variant="secondary">
                    {montador.nome}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Timeline */}
            {(os.checkInAt || os.checkOutAt) && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Clock className="h-4 w-4" />
                  Timeline
                </h3>
                <div className="flex flex-col gap-2">
                  {os.checkInAt && (
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Check-in</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(os.checkInAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  )}
                  {os.checkOutAt && (
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Check-out</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(os.checkOutAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Observacoes */}
            {os.observacoes && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Observacoes
                </h3>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground">{os.observacoes}</p>
                </div>
              </div>
            )}

            <Separator />

            {/* Valor Total */}
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold">Valor Total</p>
              <p className="text-2xl font-bold text-primary">
                R$ {os.valorTotal.toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Acoes */}
            <div className="flex gap-2">
              {os.status === 'agendada' && (
                <Button className="flex-1">Iniciar Servico</Button>
              )}
              {os.status === 'em_andamento' && (
                <Button className="flex-1">Finalizar Servico</Button>
              )}
              {os.status !== 'concluida' && os.status !== 'cancelada' && (
                <Button variant="outline" className="flex-1">
                  Editar OS
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
