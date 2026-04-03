"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LojaParceira } from "@/lib/types"
import { api } from "@/services/api"

interface NovoProdutoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proximoCodigo: number
}

export function NovoProdutoDialog({
  open,
  onOpenChange,
  proximoCodigo,
}: NovoProdutoDialogProps) {
  const [lojas, setLojas] = useState<LojaParceira[]>([])
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    categoria: "",
    valor_base: "",
    tempo_base_min: "",
    lojaId: "",
    ativo: true,
  })

  useEffect(() => {
    if (open) {
      api.get("/lojas").then((res) => {
        const data = res.data?.data ?? res.data ?? []
        setLojas(data)
      })
    }
  }, [open])

  const categorias = [
    "Área de Serviço",
    "Banheiro",
    "Cozinha",
    "Diversos",
    "Escritório",
    "Paredes",
    "Quarto",
    "Sala",
    
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      nome: formData.nome,
      categoria: formData.categoria,
      valor_base: parseFloat(formData.valor_base),
      tempo_base_min: parseInt(formData.tempo_base_min),
      loja_id: formData.lojaId,
      ativo: formData.ativo,
    }

   try {
      await api.post("/produtos", payload)
      onOpenChange(false)
      setFormData({
        codigo: "",
        nome: "",
        categoria: "",
        valor_base: "",
        tempo_base_min: "",
        lojaId: "",
        ativo: true,
      })
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Produto</DialogTitle>
          <DialogDescription>
            Cadastre um novo produto no catálogo de montagem
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">

            {/* 3. Campo de Seleção da Loja */}
            <div className="space-y-2">
              <Label htmlFor="loja">Loja Parceira</Label>
              <Select
                value={formData.lojaId}
                onValueChange={(value) =>
                  setFormData({ ...formData, lojaId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a loja dona do produto" />
                </SelectTrigger>
                <SelectContent>
                  {lojas.map((loja) => (
                    <SelectItem key={loja.id} value={loja.id}>
                      {loja.nome_fantasia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  value={proximoCodigo}
                  disabled
                  className="bg-muted font-mono"
                />
                
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoria: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Produto</Label>
              <Input
                id="nome"
                placeholder="Ex: Guarda-roupa 6 Portas"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valorMontagem">Valor da Montagem (R$)</Label>
                <Input
                  id="valorMontagem"
                  type="number"
                  step="0.01"
                  placeholder="150.00"
                  value={formData.valor_base}
                  onChange={(e) =>
                    setFormData({ ...formData, valor_base: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempoEstimado">Tempo Estimado (min)</Label>
                <Input
                  id="tempoEstimado"
                  type="number"
                  placeholder="120"
                  value={formData.tempo_base_min}
                  onChange={(e) =>
                    setFormData({ ...formData, tempo_base_min: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="ativo">Produto Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  Produto disponível para seleção em OS
                </p>
              </div>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ativo: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar Produto</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
