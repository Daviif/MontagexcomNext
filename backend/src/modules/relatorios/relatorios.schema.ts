import { z } from 'zod'

export const solicitarRelatorioSchema = z.object({
  tipo: z.enum(['pdf_os', 'excel_financeiro', 'excel_comissoes']),
  filtros: z.record(z.string(), z.unknown()).default({}),
})

export type SolicitarRelatorioInput = z.infer<typeof solicitarRelatorioSchema>
