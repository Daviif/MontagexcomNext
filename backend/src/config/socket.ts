import { Server as HttpServer } from 'http'
import { Server as SocketServer, Socket } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { redisPub, redisSub } from './redis'
import { env } from './env'
import { logger } from './logger'
import { verifyAccessToken } from '../modules/auth/auth.utils'

export let io: SocketServer

// ================================
// EVENTOS (contrato tipado)
// ================================
export type ServerToClientEvents = {
  'os:status_atualizado': (payload: { osId: string; status: string; alteradoEm: string }) => void
  'os:executor_localizacao': (payload: { osId: string; colaboradorId: string; lat: number; lng: number }) => void
  'notificacao': (payload: { tipo: string; mensagem: string; dados?: unknown }) => void
}

export type ClientToServerEvents = {
  'os:entrar': (osId: string) => void
  'os:sair': (osId: string) => void
  'executor:localizacao': (payload: { osId: string; lat: number; lng: number }) => void
}

// ================================
// BOOTSTRAP
// ================================
export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // Redis adapter — sincroniza eventos entre múltiplas instâncias se necessário
  io.adapter(createAdapter(redisPub, redisSub))

  // ================================
  // MIDDLEWARE DE AUTENTICAÇÃO
  // ================================
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined

    if (!token) {
      return next(new Error('Token não fornecido'))
    }

    try {
      const payload = verifyAccessToken(token)
      socket.data.userId = payload.sub
      socket.data.tipo = payload.tipo
      next()
    } catch {
      next(new Error('Token inválido'))
    }
  })

  // ================================
  // HANDLERS DE CONEXÃO
  // ================================
  io.on('connection', (socket) => {
    logger.debug({ socketId: socket.id, userId: socket.data.userId }, 'Socket conectado')

    // Entrar no room da OS para receber atualizações em tempo real
    socket.on('os:entrar', (osId: string) => {
      socket.join(`os:${osId}`)
      logger.debug({ socketId: socket.id, osId }, 'Socket entrou no room da OS')
    })

    socket.on('os:sair', (osId: string) => {
      socket.leave(`os:${osId}`)
    })

    // Executor transmite localização — salva no Redis (TTL 5min) e retransmite para a sala
    socket.on('executor:localizacao', async ({ osId, lat, lng }) => {
      const chave = `geo:os:${osId}:executor:${socket.data.userId}`
      await redisPub.setex(chave, 300, JSON.stringify({ lat, lng, ts: Date.now() }))

      io.to(`os:${osId}`).emit('os:executor_localizacao', {
        osId,
        colaboradorId: socket.data.userId,
        lat,
        lng,
      })
    })

    socket.on('disconnect', (reason) => {
      logger.debug({ socketId: socket.id, reason }, 'Socket desconectado')
    })
  })

  logger.info('Socket.io inicializado')
  return io
}

// ================================
// HELPERS DE EMIT (usados nos controllers)
// ================================
export function emitStatusOS(osId: string, status: string): void {
  io.to(`os:${osId}`).emit('os:status_atualizado', {
    osId,
    status,
    alteradoEm: new Date().toISOString(),
  })
}