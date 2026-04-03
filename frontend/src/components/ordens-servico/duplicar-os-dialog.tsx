import { useMemo } from 'react'
import { NovaOSDialog } from './nova-os-dialog'
import type { OrdemServico } from '@/lib/types'

interface DuplicarOSDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	ordemServico: OrdemServico | null
}

export function DuplicarOSDialog({ open, onOpenChange, ordemServico }: DuplicarOSDialogProps) {
	const osBase = useMemo (() => {
		if (!open || !ordemServico) return null
		return {
			...ordemServico,
            id: '',
            status: 'agendada' as const, // Garantindo o tipo literal
            codigo_os_loja: '',
            criadoEm: new Date(),
            atualizadoEm: new Date(),
            assinaturaCliente: undefined,
            fotos: [],
            checkInAt: undefined,
            checkOutAt: undefined,
		}
	}, [open, ordemServico])

	if (!osBase) return null

	
	return (
		<NovaOSDialog
			open={open}
			onOpenChange={onOpenChange}
			initialData={osBase} // Passa os dados pré-preenchidos para o dialog de nova OS
		/>
	)
}
