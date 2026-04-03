"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface NovoProdutoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NovoProdutoDialog({
  open,
  onOpenChange,
}: NovoProdutoDialogProps) {
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    descricao: "",
    categoria: "",
    valorMontagem: "",
    tempoEstimado: "",
    ativo: true,
  })

  const categorias = [
    "Guarda-roupa",
    "Cozinha",
    "Banheiro",
    "Quarto",
    "Sala",
    "Escritório",
    "Área de Serviço",
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui seria a chamada para a API
    console.log("Novo produto:", formData)
    onOpenChange(false)
    setFormData({
      codigo: "",
      nome: "",
      descricao: "",
      categoria: "",
      valorMontagem: "",
      tempoEstimado: "",
      ativo: true,
    })
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  placeholder="GR-001"
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo: e.target.value })
                  }
                  required
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

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descrição detalhada do produto..."
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                rows={3}
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
                  value={formData.valorMontagem}
                  onChange={(e) =>
                    setFormData({ ...formData, valorMontagem: e.target.value })
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
                  value={formData.tempoEstimado}
                  onChange={(e) =>
                    setFormData({ ...formData, tempoEstimado: e.target.value })
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
