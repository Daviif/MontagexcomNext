'use client'

import { useState } from 'react'
import { Plus, Minus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { mockLojas, mockClientesParticulares, mockProdutos, mockMontadores } from '@/lib/mock-data'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'

interface NovaOSDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ProdutoSelecionado {
  produtoId: string
  quantidade: number
  valorUnitario: number
}

export function NovaOSDialog({ open, onOpenChange }: NovaOSDialogProps) {
  const [tipoCliente, setTipoCliente] = useState<'loja' | 'particular'>('loja')
  const [clienteId, setClienteId] = useState('')
  const [produtos, setProdutos] = useState<ProdutoSelecionado[]>([])
  const [montadoresSelecionados, setMontadoresSelecionados] = useState<string[]>([])
  const [cep, setCep] = useState('')
  const [endereco, setEndereco] = useState({
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  })

  const adicionarProduto = () => {
    setProdutos([...produtos, { produtoId: '', quantidade: 1, valorUnitario: 0 }])
  }

  const removerProduto = (index: number) => {
    setProdutos(produtos.filter((_, i) => i !== index))
  }

  const atualizarProduto = (index: number, field: keyof ProdutoSelecionado, value: string | number) => {
    const novosProdutos = [...produtos]
    novosProdutos[index] = { ...novosProdutos[index], [field]: value }
    
    if (field === 'produtoId') {
      const produto = mockProdutos.find(p => p.id === value)
      if (produto) {
        novosProdutos[index].valorUnitario = produto.valorBase
      }
    }
    
    setProdutos(novosProdutos)
  }

  const buscarCep = async () => {
    if (cep.length < 8) return
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`)
      const data = await response.json()
      
      if (!data.erro) {
        setEndereco({
          logradouro: data.logradouro || '',
          numero: '',
          complemento: '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || '',
        })
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    }
  }

  const valorTotal = produtos.reduce((acc, p) => acc + (p.valorUnitario * p.quantidade), 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui seria a logica de salvar a OS
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Servico</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar uma nova ordem de servico
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[60vh] pr-4">
            <Tabs defaultValue="cliente" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="cliente">Cliente</TabsTrigger>
                <TabsTrigger value="endereco">Endereco</TabsTrigger>
                <TabsTrigger value="produtos">Produtos</TabsTrigger>
                <TabsTrigger value="equipe">Equipe</TabsTrigger>
              </TabsList>

              <TabsContent value="cliente" className="mt-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>Tipo de Cliente</FieldLabel>
                    <Select value={tipoCliente} onValueChange={(v) => setTipoCliente(v as 'loja' | 'particular')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loja">Loja Parceira</SelectItem>
                        <SelectItem value="particular">Cliente Particular</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>
                      {tipoCliente === 'loja' ? 'Selecione a Loja' : 'Selecione o Cliente'}
                    </FieldLabel>
                    <Select value={clienteId} onValueChange={setClienteId}>
                      <SelectTrigger>
                        <SelectValue placeholder={tipoCliente === 'loja' ? 'Selecione a loja...' : 'Selecione o cliente...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {tipoCliente === 'loja' ? (
                          mockLojas.filter(l => l.ativa).map((loja) => (
                            <SelectItem key={loja.id} value={loja.id}>
                              {loja.nomeFantasia}
                            </SelectItem>
                          ))
                        ) : (
                          mockClientesParticulares.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.nome}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Data Agendada</FieldLabel>
                      <Input type="date" />
                    </Field>
                    <Field>
                      <FieldLabel>Prioridade</FieldLabel>
                      <Select defaultValue="normal">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Horario Inicio</FieldLabel>
                      <Input type="time" defaultValue="09:00" />
                    </Field>
                    <Field>
                      <FieldLabel>Horario Fim</FieldLabel>
                      <Input type="time" defaultValue="12:00" />
                    </Field>
                  </div>
                </FieldGroup>
              </TabsContent>

              <TabsContent value="endereco" className="mt-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>CEP</FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        placeholder="00000-000"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                      />
                      <Button type="button" variant="outline" onClick={buscarCep}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel>Logradouro</FieldLabel>
                    <Input
                      placeholder="Rua, Avenida, etc."
                      value={endereco.logradouro}
                      onChange={(e) => setEndereco({ ...endereco, logradouro: e.target.value })}
                    />
                  </Field>

                  <div className="grid grid-cols-3 gap-4">
                    <Field>
                      <FieldLabel>Numero</FieldLabel>
                      <Input
                        placeholder="123"
                        value={endereco.numero}
                        onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })}
                      />
                    </Field>
                    <Field className="col-span-2">
                      <FieldLabel>Complemento</FieldLabel>
                      <Input
                        placeholder="Apto, Bloco, etc."
                        value={endereco.complemento}
                        onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Field>
                      <FieldLabel>Bairro</FieldLabel>
                      <Input
                        placeholder="Bairro"
                        value={endereco.bairro}
                        onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Cidade</FieldLabel>
                      <Input
                        placeholder="Cidade"
                        value={endereco.cidade}
                        onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Estado</FieldLabel>
                      <Input
                        placeholder="UF"
                        value={endereco.estado}
                        onChange={(e) => setEndereco({ ...endereco, estado: e.target.value })}
                      />
                    </Field>
                  </div>
                </FieldGroup>
              </TabsContent>

              <TabsContent value="produtos" className="mt-4">
                <FieldGroup>
                  <div className="flex items-center justify-between">
                    <Label>Produtos</Label>
                    <Button type="button" variant="outline" size="sm" onClick={adicionarProduto}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Produto
                    </Button>
                  </div>

                  {produtos.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border">
                      <p className="text-sm text-muted-foreground">
                        Nenhum produto adicionado
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {produtos.map((produto, index) => (
                        <div key={index} className="flex items-end gap-4 rounded-lg border border-border p-4">
                          <Field className="flex-1">
                            <FieldLabel>Produto</FieldLabel>
                            <Select
                              value={produto.produtoId}
                              onValueChange={(v) => atualizarProduto(index, 'produtoId', v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {mockProdutos.filter(p => p.ativo).map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.nome} - R$ {p.valorBase}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field className="w-24">
                            <FieldLabel>Qtd</FieldLabel>
                            <Input
                              type="number"
                              min="1"
                              value={produto.quantidade}
                              onChange={(e) => atualizarProduto(index, 'quantidade', parseInt(e.target.value) || 1)}
                            />
                          </Field>
                          <Field className="w-32">
                            <FieldLabel>Valor Unit.</FieldLabel>
                            <Input
                              type="number"
                              value={produto.valorUnitario}
                              onChange={(e) => atualizarProduto(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
                            />
                          </Field>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => removerProduto(index)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end border-t border-border pt-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <p className="text-2xl font-bold text-primary">
                        R$ {valorTotal.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </FieldGroup>
              </TabsContent>

              <TabsContent value="equipe" className="mt-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>Montadores</FieldLabel>
                    <div className="grid gap-2">
                      {mockMontadores.filter(m => m.ativo).map((montador) => (
                        <label
                          key={montador.id}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50"
                        >
                          <input
                            type="checkbox"
                            checked={montadoresSelecionados.includes(montador.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMontadoresSelecionados([...montadoresSelecionados, montador.id])
                              } else {
                                setMontadoresSelecionados(montadoresSelecionados.filter(id => id !== montador.id))
                              }
                            }}
                            className="h-4 w-4 rounded border-border"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{montador.nome}</p>
                            <p className="text-xs text-muted-foreground">{montador.email}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {montador.percentualSalario}%
                          </span>
                        </label>
                      ))}
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel>Observacoes</FieldLabel>
                    <Textarea placeholder="Observacoes adicionais sobre o servico..." />
                  </Field>
                </FieldGroup>
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar Ordem de Servico</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
