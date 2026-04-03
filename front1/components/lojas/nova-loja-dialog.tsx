'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'

interface NovaLojaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NovaLojaDialog({ open, onOpenChange }: NovaLojaDialogProps) {
  const [cnpj, setCnpj] = useState('')
  const [tipoRepasse, setTipoRepasse] = useState<'percentual' | 'fixo'>('percentual')
  const [cep, setCep] = useState('')
  const [endereco, setEndereco] = useState({
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  })
  const [dadosEmpresa, setDadosEmpresa] = useState({
    razaoSocial: '',
    nomeFantasia: '',
  })

  const buscarCnpj = async () => {
    if (cnpj.length < 14) return
    
    // Simulando busca na API OpenCNPJ
    // Em producao, substituir por chamada real
    try {
      // const response = await fetch(`https://open.cnpja.com/office/${cnpj.replace(/\D/g, '')}`)
      // const data = await response.json()
      
      // Dados mockados para demonstracao
      setDadosEmpresa({
        razaoSocial: 'Empresa Exemplo Ltda',
        nomeFantasia: 'Loja Exemplo',
      })
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error)
    }
  }

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
    // Aqui seria a logica de salvar a loja
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nova Loja Parceira</DialogTitle>
          <DialogDescription>
            Cadastre uma nova loja parceira no sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[60vh] pr-4">
            <FieldGroup>
              {/* CNPJ */}
              <Field>
                <FieldLabel>CNPJ</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                  />
                  <Button type="button" variant="outline" onClick={buscarCnpj}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Digite o CNPJ e clique em buscar para preencher automaticamente
                </p>
              </Field>

              {/* Dados da Empresa */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Razao Social</FieldLabel>
                  <Input
                    placeholder="Razao Social da Empresa"
                    value={dadosEmpresa.razaoSocial}
                    onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, razaoSocial: e.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel>Nome Fantasia</FieldLabel>
                  <Input
                    placeholder="Nome Fantasia"
                    value={dadosEmpresa.nomeFantasia}
                    onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, nomeFantasia: e.target.value })}
                  />
                </Field>
              </div>

              {/* Contato */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Telefone</FieldLabel>
                  <Input placeholder="(00) 0000-0000" />
                </Field>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input type="email" placeholder="contato@loja.com.br" />
                </Field>
              </div>

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
                      placeholder="Sala, Andar, etc."
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

              {/* Configuracoes de Repasse */}
              <div className="border-t border-border pt-4 mt-4">
                <h3 className="text-sm font-medium mb-4">Configuracoes de Repasse</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Tipo de Repasse</FieldLabel>
                    <Select value={tipoRepasse} onValueChange={(v) => setTipoRepasse(v as 'percentual' | 'fixo')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentual">Percentual (%)</SelectItem>
                        <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>
                      {tipoRepasse === 'percentual' ? 'Percentual de Repasse' : 'Valor de Repasse'}
                    </FieldLabel>
                    <Input
                      type="number"
                      placeholder={tipoRepasse === 'percentual' ? '15' : '120'}
                    />
                  </Field>
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  {tipoRepasse === 'percentual'
                    ? 'O percentual sera descontado do valor total de cada montagem'
                    : 'O valor fixo sera descontado por montagem realizada'}
                </p>
              </div>

              {/* Status */}
              <div className="border-t border-border pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Loja Ativa</p>
                    <p className="text-xs text-muted-foreground">
                      Lojas inativas nao poderao criar novas ordens de servico
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
            <Button type="submit">Cadastrar Loja</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
