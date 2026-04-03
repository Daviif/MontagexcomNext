'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Produto } from "@/lib/types"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface EditarProdutoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto: {
    codigo: number
    nome: string
    categoria: string
    valor_base: string
    tempo_base_min: string
    ativo: boolean
  }
  onSave: (produto: Omit<Produto, "id">) => void | Promise<void>
}

export function EditarProdutoDialog({ open, onOpenChange, produto, onSave }: EditarProdutoDialogProps) {
  const [formData, setFormData] = useState({ ...produto })

  const categorias = [
    "Paredes",
    "Cozinha",
    "Banheiro",
    "Quarto",
    "Sala",
    "Escritório",
    "Área de Serviço",
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      valor_base: Number(formData.valor_base),
      tempo_base_min: Number(formData.tempo_base_min),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
          <DialogDescription>
            Altere as informações do produto no catálogo de montagem
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  disabled
                  className="bg-muted font-bold text-primary cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
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
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, valor_base: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, tempo_base_min: e.target.value })}
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
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
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
            <Button type="submit">Salvar Alterações</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}