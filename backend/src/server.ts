import 'dotenv/config'
import http from 'http'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import pinoHttp from 'pino-http'

import { env } from './config/env'
import { logger } from './config/logger'
import { connectDatabase, disconnectDatabase } from './config/prisma'
import { connectRedis, redis } from './config/redis'
import { initSocket } from './config/socket'
import { errorHandler } from './middlewares/error.middleware'

// Workers BullMQ (iniciam ao importar)
import './jobs/email.worker'
import './jobs/notificacao.worker'
import './jobs/relatorio.worker'

// Rotas
import authRoutes from './modules/auth/auth.routes'
import pessoasRoutes from './modules/pessoas/pessoas.routes'
import ordensRoutes from './modules/ordens/ordens.routes'
import financeiroRoutes from './modules/financeiro/financeiro.routes'

async function bootstrap() {
  // ================================
  // CONEXÕES
  // ================================
  await connectDatabase()
  await connectRedis()

  // ================================
  // EXPRESS
  // ================================
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
  app.use(compression())
  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(pinoHttp({ logger }))

  // Rate limit nas rotas públicas sensíveis
  const limiterPublico = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 60,
    message: { code: 'RATE_LIMIT', message: 'Muitas requisições. Tente novamente em breve.' },
    standardHeaders: true,
    legacyHeaders: false,
  })

  // ================================
  // ROTAS
  // ================================
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.use('/api/auth', limiterPublico, authRoutes)
  app.use('/api/pessoas', pessoasRoutes)
  app.use('/api/ordens', ordensRoutes)
  app.use('/api/financeiro', financeiroRoutes)

  // Handler global de erros — deve ser o último middleware
  app.use(errorHandler)

  // ================================
  // HTTP + SOCKET.IO
  // ================================
  const httpServer = http.createServer(app)
  initSocket(httpServer)

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀  Servidor rodando na porta ${env.PORT} [${env.NODE_ENV}]`)
  })

  // ================================
  // GRACEFUL SHUTDOWN
  // ================================
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Encerrando servidor...')

    httpServer.close(async () => {
      await disconnectDatabase()
      await redis.quit()
      logger.info('Servidor encerrado com sucesso')
      process.exit(0)
    })

    // Força encerramento após 10s se algo travar
    setTimeout(() => {
      logger.error('Encerramento forçado após timeout')
      process.exit(1)
    }, 10_000)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Erro ao iniciar servidor')
  process.exit(1)
})