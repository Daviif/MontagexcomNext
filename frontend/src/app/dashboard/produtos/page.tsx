"use client"

import { useState, useEffect } from "react"
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Tag,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NovoProdutoDialog } from "@/components/produtos/novo-produto-dialog"
import { EditarProdutoDialog } from "@/components/produtos/editar-produto-dialog"
import { api } from "@/services/api"
import type { Produto } from "@/lib/types"
//import { toast } from "sonner" // Importado para resolver erro do compilador

export default function ProdutosPage() {
  const [loading, setLoading] = useState(false)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState<string>("todas")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  
  // NOVOS ESTADOS PARA EDIÇÃO (Integrando sem remover o resto)
  const [editDialogOpen, setEditDialogOpen] = useState(false) 
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)

  // Função movida para fora do useEffect para ser reutilizável
  async function fetchProdutos() {
    setLoading(true)
    try {
      const res = await api.get("/produtos")

      setProdutos(res.data?.data ?? res.data ?? [])
    } catch (err) {
      console.error("Erro ao carregar produtos:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProdutos()
  }, [])

  // FUNÇÕES DE AÇÃO
  const handleEditClick = (produto: Produto) => {
    setSelectedProduto(produto)
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async (formData: Omit<Produto, "id">) => {
    if (!selectedProduto) return
    try {
      await api.put(`/produtos/${selectedProduto.id}`, {
        codigo: formData.codigo,
        nome: formData.nome,
        categoria: formData.categoria,
        valor_base: Number(formData.valor_base),
        tempo_base_min: Number(formData.tempo_base_min),
        ativo: formData.ativo
      })
      //toast.success("Produto atualizado!")
      fetchProdutos()
    } catch (err) {
      //toast.error("Erro ao atualizar.")
      console.error('Erro ao buscar dados:', err)
      setErro('Não foi possível carregar os dados do dashboard.')
    }
  }

  const categorias = [
    "Parede",
    "Cozinha",
    "Banheiro",
    "Quarto",
    "Sala",
    "Escritório",
    "Área de Serviço",
  ]

  const produtosFiltrados = produtos.filter((produto) => {
    const matchesSearch =
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategoria =
      categoriaFilter === "todas" || produto.categoria === categoriaFilter
    return matchesSearch && matchesCategoria
  })

  const totalProdutos = produtos.length
  const produtosAtivos = produtos.filter((p) => p.ativo).length
  const valorMedioMontagem = totalProdutos > 0 ? (produtos.reduce((acc, p) => acc + Number(p.valor_base), 0) / totalProdutos) : 0
  const tempoMedioMontagem = totalProdutos > 0 ? (produtos.reduce((acc, p) => acc + Number(p.tempo_base_min), 0) / totalProdutos) : 0

  const proximoCodigo = produtos.length > 0 
  ? Math.max(...produtos.map(p => Number(p.codigo))) + 1 
  : 1;

  if (loading && produtos.length === 0) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando produtos...</p>
      </div>
    )
  }

  if (erro || !produtos) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-xl font-bold">Ops! Algo deu errado</h3>
        <p className="text-muted-foreground">{erro}</p>
        <button onClick={() => window.location.reload()} className="text-primary underline">Tentar novamente</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de Produtos</h1>
          <p className="text-muted-foreground">Gerencie os produtos e valores de montagem</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Produto
        </Button>
      </div>

      {/* TODOS OS SEUS CARDS ORIGINAIS MANTIDOS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProdutos}</div>
            <p className="text-xs text-muted-foreground">{produtosAtivos} ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorias.length}</div>
            <p className="text-xs text-muted-foreground">tipos de móveis</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {valorMedioMontagem.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">por montagem</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tempoMedioMontagem.toFixed(0)} min</div>
            <p className="text-xs text-muted-foreground">por montagem</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos Cadastrados</CardTitle>
          <CardDescription>Lista de todos os produtos disponíveis para montagem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto ou código..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas Categorias</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor Montagem</TableHead>
                  <TableHead>Tempo Est.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtosFiltrados.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell><div className="font-medium">{produto.codigo}</div></TableCell>
                    <TableCell><div className="font-medium">{produto.nome}</div></TableCell>
                    <TableCell><Badge variant="outline">{produto.categoria}</Badge></TableCell>
                    <TableCell className="font-medium">R$ {produto.valor_base}</TableCell>
                    <TableCell>{produto.tempo_base_min} min</TableCell>
                    <TableCell>
                      {produto.ativo ? (
                        <div className="flex items-center gap-1 text-emerald-500">
                          <CheckCircle2 className="h-4 w-4" /> <span className="text-sm">Ativo</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-500">
                          <XCircle className="h-4 w-4" /> <span className="text-sm">Inativo</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> Visualizar
                          </DropdownMenuItem>
                          {/* CORREÇÃO DO ONCLICK AQUI */}
                          <DropdownMenuItem onClick={() => handleEditClick(produto)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <NovoProdutoDialog open={dialogOpen} onOpenChange={setDialogOpen} proximoCodigo={proximoCodigo}/>

      
      {selectedProduto && (
        <EditarProdutoDialog
          key={selectedProduto.id}
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen} 
          produto={{
            codigo: selectedProduto.codigo,
            nome: selectedProduto.nome,
            categoria: selectedProduto.categoria,
            valor_base: selectedProduto.valor_base.toString(),
            tempo_base_min: selectedProduto.tempo_base_min.toString(),
            ativo: selectedProduto.ativo
          }} 
          onSave={handleSaveEdit} 
        />
      )}
    </div>
  )
}