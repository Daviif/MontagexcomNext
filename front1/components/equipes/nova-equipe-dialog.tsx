'use client'

import { useState } from 'react'
import { Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { mockMontadores } from '@/lib/mock-data'

interface NovaEquipeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NovaEquipeDialog({ open, onOpenChange }: NovaEquipeDialogProps) {
  const [membrosSelecionados, setMembrosSelecionados] = useState<string[]>([])
  const [liderId, setLiderId] = useState<string | null>(null)

  const toggleMembro = (id: string) => {
    if (membrosSelecionados.includes(id)) {
      setMembrosSelecionados(membrosSelecionados.filter(m => m !== id))
      if (liderId === id) {
        setLiderId(null)
      }
    } else {
      setMembrosSelecionados([...membrosSelecionados, id])
    }
  }

  const toggleLider = (id: string) => {
    if (liderId === id) {
      setLiderId(null)
    } else {
      setLiderId(id)
      if (!membrosSelecionados.includes(id)) {
        setMembrosSelecionados([...membrosSelecionados, id])
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui seria a logica de salvar a equipe
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nova Equipe</DialogTitle>
          <DialogDescription>
            Crie uma nova equipe de montadores
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[50vh] pr-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Nome da Equipe</FieldLabel>
                <Input placeholder="Ex: Equipe Alpha" />
              </Field>

              {/* Selecao de Membros */}
              <div className="border-t border-border pt-4 mt-4">
                <h3 className="text-sm font-medium mb-2">Membros da Equipe</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Selecione os montadores e defina o lider da equipe
                </p>
                
                <div className="flex flex-col gap-2">
                  {mockMontadores.filter(m => m.ativo).map((montador) => {
                    const isSelecionado = membrosSelecionados.includes(montador.id)
                    const isLider = liderId === montador.id

                    return (
                      <div
                        key={montador.id}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                          isSelecionado
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        )}
                        onClick={() => toggleMembro(montador.id)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelecionado}
                          onChange={() => toggleMembro(montador.id)}
                          className="h-4 w-4 rounded border-border"
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={cn(
                            isSelecionado
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          )}>
                            {montador.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{montador.nome}</p>
                          <p className="text-xs text-muted-foreground">{montador.email}</p>
                        </div>
                        {isSelecionado && (
                          <Button
                            type="button"
                            variant={isLider ? 'default' : 'outline'}
                            size="sm"
                            className="gap-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleLider(montador.id)
                            }}
                          >
                            <Crown className="h-3 w-3" />
                            {isLider ? 'Lider' : 'Definir Lider'}
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {membrosSelecionados.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-3">
                    {membrosSelecionados.length} montador{membrosSelecionados.length !== 1 ? 'es' : ''} selecionado{membrosSelecionados.length !== 1 ? 's' : ''}
                    {liderId && ' - Lider definido'}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="border-t border-border pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Equipe Ativa</p>
                    <p className="text-xs text-muted-foreground">
                      Equipes inativas nao poderao receber novas ordens de servico
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </FieldGroup>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={membrosSelecionados.length === 0}>
              Criar Equipe
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
