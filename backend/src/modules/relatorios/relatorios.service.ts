import { randomUUID } from 'crypto'
import { enqueueRelatorio } from '../../config/queues'
import type { SolicitarRelatorioInput } from './relatorios.schema'

const extensaoPorTipo: Record<SolicitarRelatorioInput['tipo'], string> = {
  pdf_os: 'pdf',
  excel_financeiro: 'xlsx',
  excel_comissoes: 'xlsx',
}

export async function solicitarRelatorio(data: SolicitarRelatorioInput, solicitadoPorId: string) {
  const extensao = extensaoPorTipo[data.tipo]
  const outputPath = `${Date.now()}-${randomUUID()}.${extensao}`

  const jobId = await enqueueRelatorio({
    tipo: data.tipo,
    filtros: data.filtros,
    solicitadoPorId,
    outputPath,
  })

  return {
    jobId,
    status: 'queued' as const,
    outputPath,
  }
}
