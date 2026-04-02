'use client'

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

interface NovoMontadorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NovoMontadorDialog({ open, onOpenChange }: NovoMontadorDialogProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui seria a logica de salvar o montador
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Novo Montador</DialogTitle>
          <DialogDescription>
            Cadastre um novo montador na equipe
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[50vh] pr-4">
            <FieldGroup>
              {/* Dados Pessoais */}
              <Field>
                <FieldLabel>Nome Completo</FieldLabel>
                <Input placeholder="Nome do montador" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input type="email" placeholder="email@exemplo.com" />
                </Field>
                <Field>
                  <FieldLabel>Telefone</FieldLabel>
                  <Input placeholder="(00) 00000-0000" />
                </Field>
              </div>

              {/* Configuracoes de Salario */}
              <div className="border-t border-border pt-4 mt-4">
                <h3 className="text-sm font-medium mb-4">Configuracoes de Salario</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Percentual do Salario</FieldLabel>
                    <div className="relative">
                      <Input type="number" placeholder="45" min="0" max="100" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        %
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Percentual que o montador recebe por servico
                    </p>
                  </Field>
                  <Field>
                    <FieldLabel>Meta Mensal</FieldLabel>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        R$
                      </span>
                      <Input type="number" placeholder="10000" className="pl-10" />
                    </div>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Chave PIX (opcional)</FieldLabel>
                  <Input placeholder="CPF, Email, Telefone ou Chave Aleatoria" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Utilizada para pagamento de salarios
                  </p>
                </Field>
              </div>

              {/* Acesso ao Sistema */}
              <div className="border-t border-border pt-4 mt-4">
                <h3 className="text-sm font-medium mb-4">Acesso ao Sistema</h3>
                
                <Field>
                  <FieldLabel>Senha de Acesso</FieldLabel>
                  <Input type="password" placeholder="Senha para acesso ao app" />
                  <p className="text-xs text-muted-foreground mt-1">
                    O montador usara esta senha para acessar o aplicativo mobile
                  </p>
                </Field>

                <Field>
                  <FieldLabel>Confirmar Senha</FieldLabel>
                  <Input type="password" placeholder="Confirme a senha" />
                </Field>
              </div>

              {/* Status */}
              <div className="border-t border-border pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Montador Ativo</p>
                    <p className="text-xs text-muted-foreground">
                      Montadores inativos nao podem receber novas ordens de servico
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
            <Button type="submit">Cadastrar Montador</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
