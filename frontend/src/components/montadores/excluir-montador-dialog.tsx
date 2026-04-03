import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';
import type { Montador } from '@/lib/types';

interface ExcluirMontadorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    montador: Montador | null;
    onDeleteSuccess?: () => void;
}

export function ExcluirMontadorDialog({ open, onOpenChange, montador, onDeleteSuccess }: ExcluirMontadorDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!montador) return;
        setLoading(true);
        try {
            // Exclui a OS principal
            await api.delete(`/usuarios/${montador.id}`);
            toast.success('Montador excluído com sucesso!');
            onOpenChange(false);
            if (onDeleteSuccess) onDeleteSuccess();
            else window.location.reload();
        } catch (err) {
            toast.error('Erro ao excluir montador.');
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
                        <Trash2 className="h-5 w-5" /> Excluir Montador
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    Tem certeza que deseja excluir este montador?
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
