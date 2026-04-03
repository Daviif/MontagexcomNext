import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Store, Mail, Phone, MapPin } from 'lucide-react'
import { lojas } from '@/lib/types'

interface DetalhesLojaSheetProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	loja: lojas | null
}

export function DetalhesLojaSheet({ open, onOpenChange, loja }: DetalhesLojaSheetProps) {
	if (!loja) return null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="max-w-lg h-full p-4">
				<SheetHeader>
					<SheetTitle>Detalhes da Loja</SheetTitle>
					<SheetDescription>
						Informações completas da loja
					</SheetDescription>
				</SheetHeader>
				<ScrollArea className="flex-1 w-full h-full pr-4">
					<div className="flex flex-col gap-6 pb-6">
						{/* Dados da Loja */}
						<div className="space-y-3">
							<h3 className="flex items-center gap-2 text-sm font-semibold">
								<Store className="h-4 w-4" /> Dados da Loja
							</h3>
							<div className="rounded-lg border bg-card p-4 space-y-3">
								<div>
									<p className="text-xs text-muted-foreground">Nome Fantasia</p>
									<p className="font-medium">{loja.nome_fantasia}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Razão Social</p>
									<p className="text-sm">{loja.razao_social || '-'}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground flex items-center gap-1">
										<MapPin className="h-3 w-3" /> Endereço
									</p>
									<p className="text-sm truncate">{typeof loja.endereco === 'string' 
                                        ? loja.endereco
                                        : loja.endereco
                                        ? [loja.endereco.logradouro, loja.endereco.numero, loja.endereco.cidade, loja.endereco.estado].filter(Boolean).join(', ')
                                        : '-'}
                                
                                    </p>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-xs text-muted-foreground flex items-center gap-1">
											<Phone className="h-3 w-3" /> Telefone
										</p>
										<p className="text-sm">{loja.telefone || '-'}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground flex items-center gap-1">
											<Mail className="h-3 w-3" /> E-mail
										</p>
										<p className="text-sm truncate">{loja.email || '-'}</p>
									</div>
								</div>
								{loja.created_at && (
									<div>
										<p className="text-xs text-muted-foreground">Cadastrada em</p>
										<p className="text-sm">{new Date(loja.created_at).toLocaleDateString('pt-BR')}</p>
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
