import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';
import type { OrdemServico } from '@/lib/types';

interface ExcluirOSDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	ordemServico: OrdemServico | null;
	onDeleteSuccess?: () => void;
}

export function ExcluirOSDialog({ open, onOpenChange, ordemServico, onDeleteSuccess }: ExcluirOSDialogProps) {
	const [loading, setLoading] = useState(false);

	const handleDelete = async () => {
		if (!ordemServico) return;
		setLoading(true);
		try {
			// Exclui rotas complementares primeiro
			await Promise.all([
				api.delete(`/servico_montadores/${ordemServico.id}`),
				api.delete(`/servico_produtos/${ordemServico.id}`),
			]);
			// Exclui a OS principal
			await api.delete(`/servicos/${ordemServico.id}`);
			toast.success('Ordem de serviço excluída com sucesso!');
			onOpenChange(false);
			if (onDeleteSuccess) onDeleteSuccess();
			else window.location.reload();
		} catch (err) {
			toast.error('Erro ao excluir ordem de serviço.');
            console.error(err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-destructive">
						<Trash2 className="h-5 w-5" /> Excluir Ordem de Serviço
					</DialogTitle>
				</DialogHeader>
				<div className="py-4">
					Tem certeza que deseja excluir esta ordem de serviço?
					<br />
					<span className="text-xs text-muted-foreground">Esta ação é irreversível e também removerá todos os dados complementares vinculados.</span>
				</div>
				<DialogFooter>
					<Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
					<Button variant="destructive" onClick={handleDelete} disabled={loading}>
						{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Excluir
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
