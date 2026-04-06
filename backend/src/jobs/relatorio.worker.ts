import { Worker, Job } from 'bullmq'
import Redis from 'ioredis'
import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'
import fs from 'fs'
import path from 'path'
import { env } from '../config/env'
import { logger } from '../config/logger'
import { prisma } from '../config/prisma'
import type { RelatorioJobData } from '../config/queues'

const workerConnectionOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
}

const connection = env.REDIS_URL
  ? new Redis(env.REDIS_URL, workerConnectionOptions)
  : new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      ...workerConnectionOptions,
    })

const OUTPUT_DIR = path.resolve(process.cwd(), 'tmp', 'relatorios')
fs.mkdirSync(OUTPUT_DIR, { recursive: true })

// ================================
// GERADOR DE PDF — OS
// ================================
async function gerarPdfOs(filtros: Record<string, unknown>, outputPath: string) {
  const whereOs = typeof filtros.osId === 'string' && filtros.osId.length > 0
    ? { id: filtros.osId }
    : {}

  const ordens = await prisma.ordemServico.findMany({
    where: {
      deletedAt: null,
      ...whereOs,
    },
    include: {
      clienteDestino: true,
      itens: { include: { produto: true } },
      executores: { include: { colaborador: true } },
    },
    take: 1,
  })

  const doc = new PDFDocument({ margin: 50 })
  const stream = fs.createWriteStream(outputPath)
  doc.pipe(stream)

  for (const os of ordens) {
    doc.fontSize(18).text('Ordem de Serviço', { align: 'center' })
    doc.fontSize(12).text(`Código: ${os.codigoRastreio}`)
    doc.text(`Status: ${os.statusFluxo}`)
    doc.text(`Cliente: ${os.clienteDestino.nomeRazaoSocial}`)
    doc.text(`Data programada: ${os.dataProgramada?.toLocaleDateString('pt-BR') ?? '—'}`)

    doc.moveDown()
    doc.fontSize(14).text('Itens')
    doc.fontSize(11)

    for (const item of os.itens) {
      const nome = item.produto?.nome ?? item.descricaoManual ?? '—'
      doc.text(`• ${item.quantidade}x ${nome} — R$ ${Number(item.valorUnitarioNaData).toFixed(2)}`)
    }

    doc.moveDown()
    doc
      .fontSize(12)
      .text(`Total: R$ ${Number(os.valorVendaTotal).toFixed(2)}`, { align: 'right' })

    doc.addPage()
  }

  doc.end()

  await new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve)
    stream.on('error', reject)
  })
}

// ================================
// GERADOR DE EXCEL — FINANCEIRO
// ================================
async function gerarExcelFinanceiro(filtros: Record<string, unknown>, outputPath: string) {
  const whereFinanceiro = typeof filtros.pessoaId === 'string' && filtros.pessoaId.length > 0
    ? { pessoaId: filtros.pessoaId }
    : {}

  const transacoes = await prisma.financeiroTransacao.findMany({
    where: {
      deletedAt: null,
      ...whereFinanceiro,
    },
    include: {
      pessoa: true,
      baixas: true,
    },
    orderBy: { dataVencimento: 'asc' },
    take: 1000,
  })

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Financeiro')

  ws.columns = [
    { header: 'Tipo', key: 'tipo', width: 10 },
    { header: 'Categoria', key: 'categoria', width: 15 },
    { header: 'Descrição', key: 'descricao', width: 30 },
    { header: 'Pessoa', key: 'pessoa', width: 30 },
    { header: 'Valor Total', key: 'valor', width: 14 },
    { header: 'Vencimento', key: 'vencimento', width: 14 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Valor Pago', key: 'pago', width: 14 },
  ]

  ws.getRow(1).font = { bold: true }

  for (const t of transacoes) {
    const totalPago = t.baixas.reduce((acc, b) => acc + Number(b.valorPago), 0)
    ws.addRow({
      tipo: t.tipoTransacao,
      categoria: t.categoria ?? '',
      descricao: t.descricao ?? '',
      pessoa: t.pessoa.nomeRazaoSocial,
      valor: Number(t.valorTotal),
      vencimento: new Date(t.dataVencimento).toLocaleDateString('pt-BR'),
      status: t.statusPagamento,
      pago: totalPago,
    })
  }

  await wb.xlsx.writeFile(outputPath)
}

// ================================
// WORKER
// ================================
async function processarRelatorio(job: Job<RelatorioJobData>): Promise<string> {
  const { tipo, filtros, outputPath } = job.data
  const filePath = path.join(OUTPUT_DIR, outputPath)

  logger.info({ jobId: job.id, tipo }, 'Gerando relatório')

  switch (tipo) {
    case 'pdf_os':
      await gerarPdfOs(filtros, filePath)
      break
    case 'excel_financeiro':
    case 'excel_comissoes':
      await gerarExcelFinanceiro(filtros, filePath)
      break
    default:
      throw new Error(`Tipo de relatório desconhecido: ${tipo}`)
  }

  logger.info({ jobId: job.id, filePath }, 'Relatório gerado')
  return filePath
}

export const relatorioWorker = new Worker<RelatorioJobData>(
  'relatorio',
  processarRelatorio,
  { connection, concurrency: 2 },
)

relatorioWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Falha ao gerar relatório')
})