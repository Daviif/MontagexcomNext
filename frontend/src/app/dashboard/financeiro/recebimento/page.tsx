'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function RecebimentoPage() {
	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold text-foreground">Recebimentos</h1>
				<p className="text-muted-foreground">
					Acompanhe os recebimentos previstos e confirmados.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Em breve</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Esta tela sera usada para controlar recebimentos por ordem de servico.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
