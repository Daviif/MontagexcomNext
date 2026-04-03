import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { User, Phone, MapPin } from 'lucide-react'
import { clientes_particulares } from '@/lib/types'

interface DetalhesClienteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: clientes_particulares | null
}

export function DetalhesClienteDialog({ open, onOpenChange, cliente }: DetalhesClienteDialogProps) {
  if (!cliente) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-lg h-full p-4">
        <SheetHeader>
          <SheetTitle>Detalhes do Cliente</SheetTitle>
          <SheetDescription>
            Informações completas do cliente particular
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 w-full h-full pr-4">
          <div className="flex flex-col gap-6 pb-6">
            {/* Dados Pessoais */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4" /> Dados Pessoais
              </h3>
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Nome Completo</p>
                  <p className="font-medium">{cliente.nome}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Telefone
                    </p>
                    <p className="text-sm">{cliente.telefone || '-'}</p>
                  </div>
                  <div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Endereço
                  </p>
                  <p className="text-sm truncate">{typeof cliente.endereco === 'string'
                        ? cliente.endereco
                        : cliente.endereco
                        ? [
                            cliente.endereco.logradouro,
                            cliente.endereco.numero,
                            cliente.endereco.complemento,
                            cliente.endereco.bairro,
                            cliente.endereco.cidade,
                            cliente.endereco.estado,
                            cliente.endereco.cep
                            ].filter(Boolean).join(', ')
                        : '-'}
                    </p>
                </div>
                {cliente.created_at && (
                  <div>
                    <p className="text-xs text-muted-foreground">Cadastrado em</p>
                    <p className="text-sm">{new Date(cliente.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </div>
            </div>
            <Separator />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
