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
import { User, Mail, Phone, Percent, CheckCircle2, XCircle, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Montador } from '@/lib/types'

interface DetalhesMontadorDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	montador: Montador | null
}

export function DetalhesMontadorDialog({ open, onOpenChange, montador }: DetalhesMontadorDialogProps) {
	if (!montador) return null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="max-w-lg h-full p-4">
				<SheetHeader>
					<SheetTitle>Detalhes do Montador</SheetTitle>
					<SheetDescription>
						Informações completas do montador
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
									<p className="font-medium">{montador.nome}</p>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-xs text-muted-foreground flex items-center gap-1">
											<Phone className="h-3 w-3" /> Telefone
										</p>
										<p className="text-sm">{montador.Telefone || '-'}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground flex items-center gap-1">
											<Mail className="h-3 w-3" /> E-mail
										</p>
										<p className="text-sm truncate">{montador.email || '-'}</p>
									</div>
								</div>
								{montador.created_at && (
									<div>
										<p className="text-xs text-muted-foreground">Cadastrado em</p>
										<p className="text-sm">{new Date(montador.created_at).toLocaleDateString('pt-BR')}</p>
									</div>
								)}
							</div>
						</div>

						{/* Configurações de Salário */}
						<div className="space-y-3">
							<h3 className="flex items-center gap-2 text-sm font-semibold">
								<Percent className="h-4 w-4" /> Salário e Meta
							</h3>
							<div className="rounded-lg border bg-card p-4 space-y-3">
								<div className="flex items-center gap-2">
									<Percent className="h-3 w-3 text-muted-foreground" />
									<span className="font-medium">{montador.percentual_salario}%</span>
									<span className="text-xs text-muted-foreground">Percentual do salário</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="font-medium">R$ {(montador.meta_mensal || 0).toLocaleString('pt-BR')}</span>
									<span className="text-xs text-muted-foreground">Meta Mensal</span>
								</div>
								{montador.chave_pix && (
									<div className="flex items-center gap-2">
										<KeyRound className="h-3 w-3 text-muted-foreground" />
										<span className="font-medium">{montador.chave_pix}</span>
										<span className="text-xs text-muted-foreground">Chave PIX</span>
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
										montador.ativo
											? 'bg-primary/10 text-primary border-primary/20'
											: 'bg-muted text-muted-foreground border-muted'
									)}
								>
									{montador.ativo ? (
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
