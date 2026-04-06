import { Worker, Job } from 'bullmq'
import Redis from 'ioredis'
import { env } from '../config/env'
import { logger } from '../config/logger'
import type { NotificacaoJobData } from '../config/queues'
import { redisConnectionOptions } from '../config/redis-options'

const workerConnectionOptions = { ...redisConnectionOptions }

const connection = env.REDIS_URL
  ? new Redis(env.REDIS_URL, workerConnectionOptions)
  : new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      ...workerConnectionOptions,
    })

async function processarNotificacao(job: Job<NotificacaoJobData>): Promise<void> {
  const { tipo, destinatarioId, payload } = job.data
  logger.info({ jobId: job.id, tipo, destinatarioId, payload }, 'Processando notificação')
}

export const notificacaoWorker = new Worker<NotificacaoJobData>('notificacao', processarNotificacao, {
  connection,
  concurrency: 5,
})

notificacaoWorker.on('completed', (job) => {
  logger.debug({ jobId: job.id }, 'Notificação processada com sucesso')
})

notificacaoWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Falha ao processar notificação')
})
