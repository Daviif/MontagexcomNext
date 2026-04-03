import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Package, Barcode, DollarSign, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Produto } from '@/lib/types'

interface DetalhesProdutoSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto: Produto | null
}

export function DetalhesProdutoSheet({ open, onOpenChange, produto }: DetalhesProdutoSheetProps) {
  if (!produto) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-lg h-full p-4">
        <SheetHeader>
          <SheetTitle>Detalhes do Produto</SheetTitle>
          <SheetDescription>
            Informações completas do produto
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 w-full h-full pr-4">
          <div className="flex flex-col gap-6 pb-6">
            {/* Dados do Produto */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Package className="h-4 w-4" /> Dados do Produto
              </h3>
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-medium">{produto.nome}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Barcode className="h-3 w-3" /> Código
                    </p>
                    <p className="text-sm">{produto.codigo || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Preço
                    </p>
                    <p className="text-sm">R$ {produto.valor_base?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '-'}</p>
                  </div>
                </div>
                {produto.created_at && (
                  <div>
                    <p className="text-xs text-muted-foreground">Cadastrado em</p>
                    <p className="text-sm">{new Date(produto.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </div>
            </div>
            {/* Status */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                Status
              </h3>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    produto.ativo
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-muted text-muted-foreground border-muted'
                  )}
                >
                  {produto.ativo ? (
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Ativo</span>
                  ) : (
                    <span className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Inativo</span>
                  )}
                </Badge>
              </div>
            </div>
            <Separator />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
