import { Worker, Job } from 'bullmq'
import Redis from 'ioredis'
import { env } from '../config/env'
import { logger } from '../config/logger'
import type { EmailJobData } from '../config/queues'
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

async function processarEmail(job: Job<EmailJobData>): Promise<void> {
  const { para, assunto, template, variaveis } = job.data

  logger.info({ jobId: job.id, para, template }, 'Processando envio de e-mail')

  // TODO: integrar com Nodemailer / Resend / SendGrid
  // Exemplo com Nodemailer:
  //
  // const transporter = nodemailer.createTransport({ ... })
  // const html = renderTemplate(template, variaveis)
  // await transporter.sendMail({ from: 'no-reply@app.com', to: para, subject: assunto, html })

  // Simulação para desenvolvimento
  logger.info(
    { para, assunto, template, variaveis },
    '📧 [SIMULADO] E-mail enviado',
  )
}

export const emailWorker = new Worker<EmailJobData>('email', processarEmail, {
  connection,
  concurrency: 5,
})

emailWorker.on('completed', (job) => {
  logger.debug({ jobId: job.id }, 'E-mail enviado com sucesso')
})

emailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Falha ao enviar e-mail')
})