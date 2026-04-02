'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'

interface NovoClienteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NovoClienteDialog({ open, onOpenChange }: NovoClienteDialogProps) {
  const [cep, setCep] = useState('')
  const [endereco, setEndereco] = useState({
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  })

  const buscarCep = async () => {
    if (cep.length < 8) return
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`)
      const data = await response.json()
      
      if (!data.erro) {
        setEndereco({
          logradouro: data.logradouro || '',
          numero: '',
          complemento: '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || '',
        })
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui seria a logica de salvar o cliente
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Novo Cliente Particular</DialogTitle>
          <DialogDescription>
            Cadastre um novo cliente particular no sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[50vh] pr-4">
            <FieldGroup>
              {/* Dados Pessoais */}
              <Field>
                <FieldLabel>Nome Completo</FieldLabel>
                <Input placeholder="Nome do cliente" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>CPF</FieldLabel>
                  <Input placeholder="000.000.000-00" />
                </Field>
                <Field>
                  <FieldLabel>Telefone</FieldLabel>
                  <Input placeholder="(00) 00000-0000" />
                </Field>
              </div>

              <Field>
                <FieldLabel>Email (opcional)</FieldLabel>
                <Input type="email" placeholder="email@exemplo.com" />
              </Field>

              {/* Endereco */}
              <div className="border-t border-border pt-4 mt-4">
                <h3 className="text-sm font-medium mb-4">Endereco</h3>
                
                <Field>
                  <FieldLabel>CEP</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="00000-000"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      className="max-w-[200px]"
                    />
                    <Button type="button" variant="outline" onClick={buscarCep}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </Field>

                <Field>
                  <FieldLabel>Logradouro</FieldLabel>
                  <Input
                    placeholder="Rua, Avenida, etc."
                    value={endereco.logradouro}
                    onChange={(e) => setEndereco({ ...endereco, logradouro: e.target.value })}
                  />
                </Field>

                <div className="grid grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel>Numero</FieldLabel>
                    <Input
                      placeholder="123"
                      value={endereco.numero}
                      onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })}
                    />
                  </Field>
                  <Field className="col-span-2">
                    <FieldLabel>Complemento</FieldLabel>
                    <Input
                      placeholder="Apto, Bloco, etc."
                      value={endereco.complemento}
                      onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel>Bairro</FieldLabel>
                    <Input
                      placeholder="Bairro"
                      value={endereco.bairro}
                      onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Cidade</FieldLabel>
                    <Input
                      placeholder="Cidade"
                      value={endereco.cidade}
                      onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Estado</FieldLabel>
                    <Input
                      placeholder="UF"
                      value={endereco.estado}
                      onChange={(e) => setEndereco({ ...endereco, estado: e.target.value })}
                    />
                  </Field>
                </div>
              </div>

              {/* Observacoes */}
              <Field>
                <FieldLabel>Observacoes (opcional)</FieldLabel>
                <Textarea placeholder="Informacoes adicionais sobre o cliente..." />
              </Field>
            </FieldGroup>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Cadastrar Cliente</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
