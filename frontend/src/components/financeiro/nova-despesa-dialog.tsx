'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'

interface NovaDespesaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NovaDespesaDialog({ open, onOpenChange }: NovaDespesaDialogProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui seria a logica de salvar a despesa
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Despesa</DialogTitle>
          <DialogDescription>
            Registre uma nova despesa operacional
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>Descricao</FieldLabel>
              <Input placeholder="Ex: Abastecimento Fiorino" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Categoria</FieldLabel>
                <Select defaultValue="combustivel">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="combustivel">Combustivel</SelectItem>
                    <SelectItem value="ferramentas">Ferramentas</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="veiculo">Veiculo</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Data</FieldLabel>
                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </Field>
            </div>

            <Field>
              <FieldLabel>Valor</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input type="number" placeholder="0,00" className="pl-10" step="0.01" />
              </div>
            </Field>

            <Field>
              <FieldLabel>Observacoes (opcional)</FieldLabel>
              <Textarea placeholder="Informacoes adicionais sobre a despesa..." />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Registrar Despesa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
