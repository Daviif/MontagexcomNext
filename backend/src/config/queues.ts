import { Queue } from 'bullmq'
import Redis from 'ioredis'
import { env } from './env'
import { logger } from './logger'
import { redisConnectionOptions } from './redis-options'

// Conexão exclusiva para BullMQ
const bullConnectionOptions = { ...redisConnectionOptions }

const bullConnection = env.REDIS_URL
  ? new Redis(env.REDIS_URL, bullConnectionOptions)
  : new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      ...bullConnectionOptions,
    })

bullConnection.on('error', (err) => {
  logger.error({ err }, 'Redis BullMQ erro')
})

// ================================
// DEFINIÇÃO DAS FILAS
// ================================

export const filaEmail = new Queue('email', {
  connection: bullConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
})

export const filaNotificacao = new Queue('notificacao', {
  connection: bullConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 500 },
  },
})

export const filaRelatorio = new Queue('relatorio', {
  connection: bullConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
})

// ================================
// TIPOS DOS JOBS
// ================================

export type EmailJobData = {
  para: string
  assunto: string
  template: 'os_criada' | 'os_concluida' | 'os_cancelada' | 'reset_senha'
  variaveis: Record<string, string>
}

export type NotificacaoJobData = {
  tipo: 'OS_STATUS' | 'PAGAMENTO' | 'GEOLOCALIZACAO'
  destinatarioId: string
  payload: Record<string, unknown>
}

export type RelatorioJobData = {
  tipo: 'pdf_os' | 'excel_financeiro' | 'excel_comissoes'
  filtros: Record<string, unknown>
  solicitadoPorId: string
  outputPath: string
}

// ================================
// HELPERS DE ENQUEUE
// ================================

export async function enqueueEmail(data: EmailJobData): Promise<void> {
  await filaEmail.add('enviar', data)
  logger.debug({ para: data.para, template: data.template }, 'Email enfileirado')
}

export async function enqueueNotificacao(data: NotificacaoJobData): Promise<void> {
  await filaNotificacao.add('enviar', data)
}

export async function enqueueRelatorio(data: RelatorioJobData): Promise<string> {
  const job = await filaRelatorio.add('gerar', data)
  return job.id!
}