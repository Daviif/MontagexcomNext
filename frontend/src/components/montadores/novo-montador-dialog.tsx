'use client'
import { useState} from 'react'
import { api } from '@/services/api'
import { toast } from 'sonner'
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
import { Loader2 } from 'lucide-react'

interface NovoMontadorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function NovoMontadorDialog({ open, onOpenChange, onSuccess}: NovoMontadorDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    percentual_salario: '',
    meta_mensal: '',
    chave_pix: '',
    senha: '',
    confirmarSenha: '',
    ativo: true
  })

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.senha !== formData.confirmarSenha) {
      return toast.error("As senhas não coincidem")
    }
    try {
      setLoading(true)
      const payload = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        percentual_salario: Number(formData.percentual_salario),
        meta_mensal: formData.meta_mensal ? Number(formData.meta_mensal) : null,
        chave_pix: formData.chave_pix,
        senha: formData.senha,
        tipo: 'montador', // Define fixo como montador
        ativo: formData.ativo
      }

      await api.post('/usuarios', payload)
      
      toast.success("Montador cadastrado com sucesso!")
      onSuccess() 
      onOpenChange(false)

      setFormData({
        nome: '', email: '', telefone: '', percentual_salario: '',
        meta_mensal: '', chave_pix: '', senha: '', confirmarSenha: '', ativo: true
      })
    } catch (err) {
      toast.error("Erro ao cadastrar montador")
      console.error('Erro ao cadastrar montador:', err);
    } finally {
      setLoading(false)
    }    
}

if (loading) {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando detalhes...</p>
    </div>
  )
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
                <Input required placeholder="Nome do montador" value={formData.nome}
                 onChange={e => handleChange('nome', e.target.value)}/>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input type="email" placeholder="email@exemplo.com" value={formData.email} 
                  onChange={e => handleChange('email', e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel>Telefone</FieldLabel>
                  <Input placeholder="(00) 00000-0000" value={formData.telefone} 
                  onChange={e => handleChange('telefone', e.target.value)}  />
                </Field>
              </div>

              {/* Configuracoes de Salario */}
              <div className="border-t border-border pt-4 mt-4">
                <h3 className="text-sm font-medium mb-4">Configuracoes de Salario</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Percentual do Salario</FieldLabel>
                    <div className="relative">
                      <Input type="number" placeholder="45" min="0" max="100" value={formData.percentual_salario} onChange={e => handleChange('percentual_salario', e.target.value)} />
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
                      <Input type="number" placeholder="10000" className="pl-10" value={formData.meta_mensal} onChange={e => handleChange('meta_mensal', e.target.value)} />
                    </div>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Chave PIX (opcional)</FieldLabel>
                  <Input placeholder="CPF, Email, Telefone ou Chave Aleatoria" value={formData.chave_pix} onChange={e => handleChange('chave_pix', e.target.value)} />
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
                  <Input type="password" placeholder="Senha para acesso ao app" value={formData.senha} onChange={e => handleChange('senha', e.target.value)} />
                  
                </Field>

                <Field>
                  <FieldLabel>Confirmar Senha</FieldLabel>
                  <Input type="password" placeholder="Confirme a senha" value={formData.confirmarSenha} onChange={e => handleChange('confirmar_senha', e.target.value)} />
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
