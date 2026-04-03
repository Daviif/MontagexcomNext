'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Minus, Search, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { api } from '@/services/api'
import { toast } from 'sonner'
import { clientes_particulares, lojas, Montador, Produto, Usuario, OrdemServico, TipoCliente } from '@/lib/types'

interface NovaOSDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: any
}

interface ProdutoSelecionado {
  produtoId: string
  quantidade: number
  valorUnitario: number
  utilizarDesconto?: boolean
  valorDesconto?: number
}

export function NovaOSDialog({ open, onOpenChange, initialData }: NovaOSDialogProps) {
  const [loading, setLoading] = useState(false)
  const [tipoCliente, setTipoCliente] = useState<'loja' | 'particular'>('loja')
  const [statusOs, setStatusOs] = useState<string>('agendada')
  const [clienteId, setClienteId] = useState('')
  const [produtos, setProdutos] = useState<ProdutoSelecionado[]>([])
  const [montadoresSelecionados, setMontadoresSelecionados] = useState<string[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [dataServico, setDataServico] = useState('')
  const [prioridade, setPrioridade] = useState('normal')

  const [horarioInicio, setHorarioInicio] = useState('09:00')
  const [horarioFim, setHorarioFim] = useState('12:00')

  const [cep, setCep] = useState('')
  const [endereco, setEndereco] = useState({
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
  })

  const [lojas, setLojas] = useState<lojas[]>([])
  const [clientes, setClientes] = useState<clientes_particulares[]>([])
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<Produto[]>([])
  const [montadoresDisponiveis, setMontadoresDisponiveis] = useState<Montador[]>([])
  const [codigo_os_loja, setCodigoOsLoja] = useState<OrdemServico[]>([])
  const [erro, setErro] = useState('')

  // 1. Busca dados básicos da API ao abrir
  useEffect(() => {
    async function fetchNovaOS() {
      if (!open) return;
      try {
        setLoading(true)
        const [particularesRes, lojasRes, produtosRes, usuariosRes, codigoOsRes] = await Promise.all([
          api.get('/clientes_particulares'),
          api.get('/lojas'),
          api.get('/produtos'),
          api.get('/usuarios'),
          api.get('/servicos')
        ])

        setCodigoOsLoja(codigoOsRes.data?.data ?? codigoOsRes.data ?? [])
        setClientes(particularesRes.data?.data ?? particularesRes.data ?? [])
        setLojas(lojasRes.data?.data ?? lojasRes.data ?? [])
        setProdutosDisponiveis(produtosRes.data?.data ?? produtosRes.data ?? [])

        const todos = usuariosRes.data?.data ?? usuariosRes.data ?? []
        setMontadoresDisponiveis(todos.filter((u: Usuario) => u.tipo === 'montador'))
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
        setErro('Não foi possível carregar os dados necessários.')
      } finally {
        setLoading(false)
      }
    }
    fetchNovaOS()
  }, [open])

  // 2. Preenche formulário se for Duplicação/Cópia
  useEffect(() => {
    if (open && initialData) {
      setTipoCliente(initialData.tipo_cliente || 'loja')
      setClienteId(initialData.loja_id || initialData.cliente_particular_id || '')
      setObservacoes(initialData.observacoes || '')
      setPrioridade(initialData.prioridade || 'normal')
      setStatusOs(initialData.status || 'agendada')
      setHorarioInicio(initialData.janela_inicio || '09:00')
      setHorarioFim(initialData.janela_fim || '12:00')

      if (initialData.data_servico) {
        const d = new Date(initialData.data_servico)
        if (!isNaN(d.getTime())) setDataServico(d.toISOString().split('T')[0])
      }

      if (typeof initialData.endereco_execucao === 'string') {
        const partes = initialData.endereco_execucao.split(',')
        setEndereco({
          logradouro: partes[0]?.trim() || '',
          numero: partes[1]?.trim() || '',
          bairro: partes[2]?.trim() || '',
          cidade: partes[3]?.split('-')[0]?.trim() || '',
          estado: partes[3]?.split('-')[1]?.trim() || '',
          complemento: '',
          cep: ''
        })
      }

      const rawProds = initialData.ServicoProdutos || initialData.produtos || []
      setProdutos(rawProds.map((p: any) => ({
        produtoId: p.produto_id || p.produtoId,
        quantidade: p.quantidade,
        valorUnitario: Number(p.valor_unitario || p.valorUnitario || 0),
        utilizarDesconto: p.utilizar_desconto || false,
        valorDesconto: Number(p.valor_desconto || p.valorDesconto || 0)
      })))

      const rawMont = initialData.servico_montadores || initialData.montadores || []
      setMontadoresSelecionados(rawMont.map((m: Montador) => m.id))

    } else if (open && !initialData) {
      // Reset para nova OS limpa
      setClienteId('')
      setProdutos([])
      setCodigoOsLoja([])
      setMontadoresSelecionados([])
      setObservacoes('')
      setDataServico('')
      setEndereco({ logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' })
    }
  }, [open, initialData])

  const handleClienteParticularChange = (id: string) => {
    setClienteId(id)
    const cliente = clientes.find(c => c.id === id)
    if (cliente && cliente.endereco) {
      const partes = cliente.endereco.split(',')
      setEndereco({
        logradouro: partes[0]?.trim() || '',
        numero: partes[1]?.trim() || '',
        bairro: partes[2]?.trim() || '',
        complemento: partes[3]?.trim() || '',
        cidade: partes[4]?.trim() || '',
        estado: partes[5]?.trim() || '',
        cep: partes[6]?.trim() || '',
      })
    }
  }

  const buscarCep = async () => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length < 8) return
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()
      if (!data.erro) {
        setEndereco({
          ...endereco,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || '',
          cep: data.cep || ''
        })
      }
    } catch (error) { console.error(error) }
  }

  const valorTotal = useMemo(() => {
    return produtos.reduce((acc, p) => {
      const subtotal = p.valorUnitario * p.quantidade
      const desconto = p.utilizarDesconto ? (Number(p.valorDesconto) || 0) : 0
      return acc + (subtotal - desconto)
    }, 0)
  }, [produtos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const osPayload = {
        tipo_cliente: tipoCliente,
        loja_id: tipoCliente === 'loja' ? clienteId : null,
        cliente_particular_id: tipoCliente === 'particular' ? clienteId : null,
        endereco_execucao: `${endereco.logradouro}, ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade}-${endereco.estado}`,
        data_servico: dataServico,
        codigo_os_loja: codigo_os_loja,
        janela_inicio: horarioInicio,
        janela_fim: horarioFim,
        prioridade: prioridade,
        valor_total: valorTotal,
        status: statusOs,
        observacoes: observacoes
      }

      const osRes = await api.post('/servicos', osPayload)
      const servicoId = osRes.data.id || osRes.data.data?.id

      await Promise.all([
        ...produtos.map(p => api.post('/servico_produtos', {
          servico_id: servicoId,
          produto_id: p.produtoId,
          quantidade: p.quantidade,
          valor_unitario: p.valorUnitario,
          utilizar_desconto: p.utilizarDesconto || false,
          valor_desconto: p.valorDesconto || 0
        })),
        ...montadoresSelecionados.map(mId => api.post('/servico_montadores', {
          servico_id: servicoId,
          usuario_id: mId,
          valor_atribuido: 0
        }))
      ])

      toast.success("Ordem de Serviço criada!")
      onOpenChange(false)
      window.location.reload()
    } catch (err) {
      console.error(err)
      toast.error("Erro ao salvar a OS.")
    } finally {
      setLoading(false)
    }
  }

  if (erro) return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-2">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <p className="text-destructive">{erro}</p>
      <Button variant="outline" onClick={() => window.location.reload()}>Recarregar</Button>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}
        <DialogHeader>
          <DialogTitle>Ordem de Serviço</DialogTitle>
          <DialogDescription>Preencha os detalhes da operação.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[60vh] pr-4">
            <Tabs defaultValue="cliente">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="cliente">Cliente</TabsTrigger>
                <TabsTrigger value="endereco">Endereço</TabsTrigger>
                <TabsTrigger value="produtos">Produtos</TabsTrigger>
                <TabsTrigger value="equipe">Equipe</TabsTrigger>
              </TabsList>

              <TabsContent value="cliente" className="space-y-4 pt-4">
                <FieldGroup>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Código OS</FieldLabel>
                      <Input placeholder='5897' value={codigo_os_loja[0]?.codigo_os_loja} className="bg-muted" />
                    </Field>
                    <Field>
                      <FieldLabel>Status Inicial</FieldLabel>
                      <Select value={statusOs} onValueChange={setStatusOs}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agendada">Agendada</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="concluido">Concluída</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel>Tipo de Cliente</FieldLabel>
                    <Select value={tipoCliente} onValueChange={(v: TipoCliente) => { setTipoCliente(v); setClienteId('') }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loja">Loja Parceira</SelectItem>
                        <SelectItem value="particular">Cliente Particular</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Seleção de Cliente</FieldLabel>
                    <Select value={clienteId} onValueChange={tipoCliente === 'particular' ? handleClienteParticularChange : setClienteId}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {tipoCliente === 'loja' 
                          ? lojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome_fantasia || l.razao_social}</SelectItem>)
                          : clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)
                        }
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field><FieldLabel>Data</FieldLabel><Input type="date" value={dataServico} onChange={e => setDataServico(e.target.value)} /></Field>
                    <Field>
                      <FieldLabel>Prioridade</FieldLabel>
                      <Select value={prioridade} onValueChange={setPrioridade}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </FieldGroup>
              </TabsContent>

              <TabsContent value="endereco" className="space-y-4 pt-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>CEP</FieldLabel>
                    <div className="flex gap-2">
                      <Input placeholder="00000-000" value={cep} onChange={e => setCep(e.target.value)} />
                      <Button type="button" variant="outline" onClick={buscarCep}><Search className="h-4 w-4" /></Button>
                    </div>
                  </Field>
                  <Field><FieldLabel>Logradouro</FieldLabel><Input value={endereco.logradouro} onChange={e => setEndereco({...endereco, logradouro: e.target.value})} /></Field>
                  <div className="grid grid-cols-3 gap-4">
                    <Field><FieldLabel>Número</FieldLabel><Input value={endereco.numero} onChange={e => setEndereco({...endereco, numero: e.target.value})} /></Field>
                    <Field><FieldLabel>Bairro</FieldLabel><Input value={endereco.bairro} onChange={e => setEndereco({...endereco, bairro: e.target.value})} /></Field>
                    <Field><FieldLabel>Cidade</FieldLabel><Input value={endereco.cidade} onChange={e => setEndereco({...endereco, cidade: e.target.value})} /></Field>
                  </div>
                </FieldGroup>
              </TabsContent>

              <TabsContent value="produtos" className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <Label>Lista de Produtos</Label>
                  <Button type="button" size="sm" variant="outline" onClick={() => setProdutos([...produtos, { produtoId: '', quantidade: 1, valorUnitario: 0 }])}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar
                  </Button>
                </div>
                {produtos.map((p, i) => (
                  <div key={i} className="space-y-2 border p-3 rounded-md bg-secondary/10">
                    <div className="flex gap-2 items-end">
                      <Field className="flex-1">
                        <Select value={p.produtoId} onValueChange={v => {
                          const pData = produtosDisponiveis.find(pd => pd.id === v);
                          const novos = [...produtos];
                          novos[i] = { ...novos[i], produtoId: v, valorUnitario: (pData?.valor_base || 0) };
                          setProdutos(novos);
                        }}>
                          <SelectTrigger className="h-9 truncate"><SelectValue placeholder="Produto..." /></SelectTrigger>
                          <SelectContent>
                            {produtosDisponiveis.map(pd => <SelectItem key={pd.id} value={pd.id}>{pd.nome}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <div className="w-16"><Input type="number" value={p.quantidade} onChange={e => {
                        const novos = [...produtos]; novos[i].quantidade = parseInt(e.target.value) || 0; setProdutos(novos);
                      }}/></div>
                      <div className="w-24"><Input type="number" value={p.valorUnitario} onChange={e => {
                        const novos = [...produtos]; novos[i].valorUnitario = parseFloat(e.target.value) || 0; setProdutos(novos);
                      }}/></div>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setProdutos(produtos.filter((_, idx) => idx !== i))}><Minus className="h-4 w-4" /></Button>
                    </div>
                    <div className="flex items-center gap-4 border-t pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold">
                        <input type="checkbox" checked={p.utilizarDesconto} onChange={e => {
                          const novos = [...produtos]; novos[i].utilizarDesconto = e.target.checked;
                          if (!e.target.checked) novos[i].valorDesconto = 0;
                          setProdutos(novos);
                        }} /> APLICAR DESCONTO
                      </label>
                      {p.utilizarDesconto && (
                        <Input type="number" className="h-7 w-20 text-xs" placeholder="R$ 0,00" value={p.valorDesconto} onChange={e => {
                          const novos = [...produtos]; novos[i].valorDesconto = Number(e.target.value); setProdutos(novos);
                        }} />
                      )}
                      <div className="flex-1 text-right text-[10px] font-bold text-emerald-600">
                        Item: R$ {((p.quantidade * p.valorUnitario) - (p.utilizarDesconto ? (p.valorDesconto || 0) : 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="equipe" className="space-y-4 pt-4">
                <FieldLabel>Selecione a Equipe</FieldLabel>
                <div className="grid gap-2 max-h-[25vh] overflow-y-auto border rounded-md p-2">
                  {montadoresDisponiveis.map(m => (
                    <label key={m.id} className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer rounded">
                      <input type="checkbox" checked={montadoresSelecionados.includes(m.id)} onChange={e => e.target.checked 
                        ? setMontadoresSelecionados([...montadoresSelecionados, m.id]) 
                        : setMontadoresSelecionados(montadoresSelecionados.filter(id => id !== m.id))} />
                      <div className="text-sm">
                        <p className="font-bold">{m.nome}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <Field><FieldLabel>Observações</FieldLabel><Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} /></Field>
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <DialogFooter className="mt-6 border-t pt-4">
            <div className="flex-1 text-left font-bold text-lg text-primary">Total: R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Salvar Ordem de Serviço
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}