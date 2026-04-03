'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertTriangle, Plus, Minus, CheckCircle2 } from 'lucide-react'
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { api } from '@/services/api'
import { toast } from 'sonner'
import type { clientes_particulares, lojas, Montador, Produto, Usuario, StatusOS, OrdemServico } from '@/lib/types'

interface EditarOSDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    ordemServico: OrdemServico | null
    onSaveSuccess?: () => void
}

interface ProdutoSelecionado {
    id?: string 
    produtoId: string
    quantidade: number
    valorUnitario: number
    utilizarDesconto: boolean 
    valorDesconto: number
}

export function EditarOSDialog({ open, onOpenChange, ordemServico, onSaveSuccess }: EditarOSDialogProps) {
    const [loading, setLoading] = useState(false)
    const [tipoCliente, setTipoCliente] = useState<'loja' | 'particular'>('loja')
    const [statusOs, setStatusOs] = useState<StatusOS>('agendada')
    const [clienteId, setClienteId] = useState('')
    const [produtos, setProdutos] = useState<ProdutoSelecionado[]>([])
    const [montadoresSelecionados, setMontadoresSelecionados] = useState<string[]>([])
    const [observacoes, setObservacoes] = useState('')
    const [dataServico, setDataServico] = useState('')
    const [prioridade, setPrioridade] = useState('normal')
    const [horarioInicio, setHorarioInicio] = useState('09:00')
    const [horarioFim, setHorarioFim] = useState('12:00')
    
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
    const [erro, setErro] = useState('')

    useEffect(() => {
        if (!ordemServico) return;

        setTipoCliente(ordemServico.tipo_cliente as 'loja' | 'particular')
        setStatusOs(ordemServico.status)
        setClienteId(ordemServico.loja_id || ordemServico.cliente_particular_id || '')
        setObservacoes(ordemServico.observacoes || '')
        setDataServico(ordemServico.data_servico ? new Date(ordemServico.data_servico).toISOString().slice(0, 10) : '')
        setPrioridade(ordemServico.prioridade || 'normal')
        setHorarioInicio(ordemServico.janela_inicio || '09:00')
        setHorarioFim(ordemServico.janela_fim || '12:00')

        if (typeof ordemServico.endereco_execucao === 'string') {
            const partes = ordemServico.endereco_execucao.split(',')
            setEndereco({
                logradouro: partes[0]?.trim() || '',
                numero: partes[1]?.trim() || '',
                bairro: partes[2]?.trim() || '',
                cidade: partes[3]?.trim() || '',
                estado: '',
                cep: '',
                complemento: ''
            })
        }
    }, [ordemServico])

    useEffect(() => {
        async function fetchData() {
            if (!open || !ordemServico?.id) return;
            try {
                setLoading(true)
                const [particularesRes, lojasRes, produtosRes, usuariosRes, osFullRes] = await Promise.all([
                    api.get('/clientes_particulares'),
                    api.get('/lojas'),
                    api.get('/produtos'),
                    api.get('/usuarios'),
                    api.get(`/servicos/${ordemServico.id}`)
                ])
                const osCompleta = osFullRes.data?.data ?? osFullRes.data;
                
                const listaProdutos = osCompleta.ServicoProdutos || osCompleta.produtos || [];
                setProdutos(listaProdutos.map((p: any) => ({
                    produtoId: p.produto_id,
                    quantidade: Number(p.quantidade),
                    valorUnitario: Number(p.valor_unitario),
                    utilizarDesconto: !!p.utilizar_desconto,
                    valorDesconto: Number(p.valor_desconto || 0)
                })));

                const listaMontadores = osCompleta.montadores || osCompleta.servico_montadores || [];
                setMontadoresSelecionados(listaMontadores.map((m: any) => m.usuario_id || m.id));

                setClientes(particularesRes.data?.data ?? particularesRes.data ?? [])
                setLojas(lojasRes.data?.data ?? lojasRes.data ?? [])
                setProdutosDisponiveis(produtosRes.data?.data ?? produtosRes.data ?? [])
                const todos = usuariosRes.data?.data ?? usuariosRes.data ?? []
                setMontadoresDisponiveis(todos.filter((u: Usuario) => u.tipo === 'montador'))
            } catch (err) {
                console.error('Erro ao buscar dados:', err)
                setErro('Não foi possível carregar os dados.')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [open, ordemServico?.id])

    const valorTotal = produtos.reduce((acc, p) => {
        const subtotal = Number(p.valorUnitario) * p.quantidade;
        const desconto = p.utilizarDesconto ? Number(p.valorDesconto) : 0;
        return acc + (subtotal - desconto);
    }, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!ordemServico) return

        try {
            setLoading(true)
            const lojaSelecionada = tipoCliente === 'loja' ? lojas.find(l => l.id === clienteId) : null;
            
            const repasseBase = lojaSelecionada?.usa_porcentual 
            && lojaSelecionada?.porcentagem_repasse != null
            ? (valorTotal * Number(lojaSelecionada.porcentagem_repasse)) / 100
            : valorTotal;
            
            const payload = {
                tipo_cliente: tipoCliente,
                loja_id: tipoCliente === 'loja' ? clienteId : null,
                cliente_particular_id: tipoCliente === 'particular' ? clienteId : null,
                status: statusOs,
                prioridade,
                data_servico: dataServico,
                janela_inicio: horarioInicio,
                janela_fim: horarioFim,
                observacoes,
                valor_total: valorTotal,
                valor_repasse_montagem: Number(repasseBase.toFixed(2)),
                endereco_execucao: `${endereco.logradouro}, ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade}`,
                produtos: produtos.map(p => ({
                    produto_id: p.produtoId,
                    quantidade: p.quantidade,
                    valor_unitario: p.valorUnitario,
                    utilizar_desconto: p.utilizarDesconto,
                    valor_desconto: p.valorDesconto,
                    valor_total: Number(((p.quantidade * p.valorUnitario) - (p.utilizarDesconto ? p.valorDesconto : 0)).toFixed(2))
                })),
                montadores: montadoresSelecionados
            }

            await api.put(`/servicos/${ordemServico.id}`, payload)
            toast.success("Ordem de serviço atualizada!")
            onOpenChange(false)
            if (onSaveSuccess) onSaveSuccess()
            else window.location.reload()
        } catch (error) {
            toast.error("Erro ao salvar alterações")
        } finally {
            setLoading(false)
        }
    }

    if (!ordemServico) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh]">
                {loading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                )}
                <DialogHeader>
                    <DialogTitle>Editar Ordem de Serviço</DialogTitle>
                    <DialogDescription>ID: {ordemServico.codigo_os_loja || ordemServico.id.slice(0,8)}</DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit}>
                    <ScrollArea className="h-[60vh] pr-4">
                        <Tabs defaultValue="cliente" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="cliente">Geral</TabsTrigger>
                                <TabsTrigger value="endereco">Local</TabsTrigger>
                                <TabsTrigger value="produtos">Produtos</TabsTrigger>
                                <TabsTrigger value="equipe">Equipe</TabsTrigger>
                            </TabsList>

                            <TabsContent value="cliente" className="mt-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel>Status da OS</FieldLabel>
                                        <Select value={statusOs} onValueChange={(v: StatusOS) => setStatusOs(v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="agendada">Agendada</SelectItem>
                                                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                                                <SelectItem value="concluido">Concluído</SelectItem>
                                                <SelectItem value="cancelada">Cancelada</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
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
                                <div className="grid grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel>Tipo de Cliente</FieldLabel>
                                        <Select value={tipoCliente} onValueChange={(v: "loja" | "particular") => setTipoCliente(v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="loja">Loja Parceira</SelectItem>
                                                <SelectItem value="particular">Particular</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field>
                                        <FieldLabel>Cliente Selecionado</FieldLabel>
                                        <Select value={clienteId} onValueChange={setClienteId}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {tipoCliente === 'loja' 
                                                    ? lojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome_fantasia}</SelectItem>)
                                                    : clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)
                                                }
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <Field>
                                        <FieldLabel>Data</FieldLabel>
                                        <Input type="date" value={dataServico} onChange={e => setDataServico(e.target.value)} />
                                    </Field>
                                    <Field>
                                        <FieldLabel>Início</FieldLabel>
                                        <Input type="time" value={horarioInicio} onChange={e => setHorarioInicio(e.target.value)} />
                                    </Field>
                                    <Field>
                                        <FieldLabel>Fim</FieldLabel>
                                        <Input type="time" value={horarioFim} onChange={e => setHorarioFim(e.target.value)} />
                                    </Field>
                                </div>
                            </TabsContent>

                            <TabsContent value="endereco" className="mt-4 space-y-4">
                                <FieldGroup>
                                    <Field><FieldLabel>Logradouro</FieldLabel><Input value={endereco.logradouro} onChange={e => setEndereco({...endereco, logradouro: e.target.value})} /></Field>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field><FieldLabel>Número</FieldLabel><Input value={endereco.numero} onChange={e => setEndereco({...endereco, numero: e.target.value})} /></Field>
                                        <Field><FieldLabel>Bairro</FieldLabel><Input value={endereco.bairro} onChange={e => setEndereco({...endereco, bairro: e.target.value})} /></Field>
                                    </div>
                                    <Field><FieldLabel>Cidade</FieldLabel><Input value={endereco.cidade} onChange={e => setEndereco({...endereco, cidade: e.target.value})} /></Field>
                                </FieldGroup>
                            </TabsContent>

                            <TabsContent value="produtos" className="mt-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label>Itens da OS</Label>
                                    <Button type="button" size="sm" variant="outline" onClick={() => setProdutos([...produtos, { produtoId: '', quantidade: 1, valorUnitario: 0, utilizarDesconto: false, valorDesconto: 0 }])}>
                                        <Plus className="h-4 w-4 mr-1" /> Add Produto
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {produtos.map((p, i) => (
                                        <div key={i} className="flex flex-col gap-2 p-3 border rounded-md bg-secondary/5">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <Select value={p.produtoId} onValueChange={v => {
                                                        const pd = produtosDisponiveis.find(x => x.id === v)
                                                        const novos = [...produtos]
                                                        novos[i] = { ...novos[i], produtoId: v, valorUnitario: pd?.valor_base || 0 }
                                                        setProdutos(novos)
                                                    }}>
                                                        <SelectTrigger className='h-9 truncate'><SelectValue placeholder="Produto..." /></SelectTrigger>
                                                        <SelectContent>
                                                            {produtosDisponiveis.map(pd => <SelectItem key={pd.id} value={pd.id}>{pd.nome}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="w-16 shrink-0">
                                                    <Input type="number" className="h-9 px-2" value={p.quantidade} onChange={e => {
                                                        const novos = [...produtos]; novos[i].quantidade = Number(e.target.value); setProdutos(novos)
                                                    }} />
                                                </div>
                                                <div className="w-24 shrink-0">
                                                    <Input type="number" className="h-9 px-2 font-mono text-xs" value={p.valorUnitario} onChange={e => {
                                                        const novos = [...produtos]; novos[i].valorUnitario = Number(e.target.value); setProdutos(novos)
                                                    }} />
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive shrink-0" onClick={() => setProdutos(produtos.filter((_, idx) => idx !== i))}>
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="flex items-center gap-4 px-1 border-t border-border/40 pt-2">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="rounded border-gray-300 text-primary h-3 w-3"
                                                        checked={p.utilizarDesconto}
                                                        onChange={e => {
                                                            const novos = [...produtos];
                                                            novos[i].utilizarDesconto = e.target.checked;
                                                            if (!e.target.checked) novos[i].valorDesconto = 0;
                                                            setProdutos(novos);
                                                        }}
                                                    />
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Aplicar Desconto</span>
                                                </label>

                                                {p.utilizarDesconto && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-muted-foreground">R$</span>
                                                        <Input 
                                                            type="number" 
                                                            className="h-7 w-20 text-xs font-mono" 
                                                            placeholder="0,00"
                                                            value={p.valorDesconto}
                                                            onChange={e => {
                                                                const novos = [...produtos];
                                                                novos[i].valorDesconto = Number(e.target.value);
                                                                setProdutos(novos);
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                
                                                <div className="flex-1 text-right text-[10px] font-bold text-emerald-500">
                                                    Total Item: R$ {((p.quantidade * p.valorUnitario) - (p.utilizarDesconto ? p.valorDesconto : 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="equipe" className="mt-4 space-y-4">
                                <div className="grid gap-2">
                                    {montadoresDisponiveis.map(m => (
                                        <label key={m.id} className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-muted">
                                            <input 
                                                type="checkbox" 
                                                checked={montadoresSelecionados.includes(m.id)}
                                                onChange={e => e.target.checked 
                                                    ? setMontadoresSelecionados([...montadoresSelecionados, m.id])
                                                    : setMontadoresSelecionados(montadoresSelecionados.filter(id => id !== m.id))
                                                }
                                            />
                                            <span className="text-sm font-medium">{m.nome}</span>
                                        </label>
                                    ))}
                                </div>
                                <Field>
                                    <FieldLabel>Observações</FieldLabel>
                                    <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} />
                                </Field>
                            </TabsContent>
                        </Tabs>
                    </ScrollArea>

                    <DialogFooter className="mt-6 border-t pt-4">
                        <div className="flex-1 text-left font-bold text-lg text-primary">
                            Total: R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>Salvar Alterações</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}