import Redis from 'ioredis'
import { env } from './env'
import { logger } from './logger'
import { redisConnectionOptions } from './redis-options'

const redisBaseConfig = {
  ...redisConnectionOptions,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 100, 3000)
    logger.warn({ attempt: times, delay }, 'Redis reconectando...')
    return delay
  },
}

const redisConfig = env.REDIS_URL
  ? { ...redisBaseConfig }
  : {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      ...redisBaseConfig,
    }

// Cliente principal (cache, sessões, geolocalização)
export const redis = env.REDIS_URL ? new Redis(env.REDIS_URL, redisConfig) : new Redis(redisConfig)

// Clientes dedicados para o Socket.io adapter (pub/sub exige conexões separadas)
export const redisPub = env.REDIS_URL ? new Redis(env.REDIS_URL, redisConfig) : new Redis(redisConfig)
export const redisSub = env.REDIS_URL ? new Redis(env.REDIS_URL, redisConfig) : new Redis(redisConfig)

redis.on('connect', () => logger.info('Redis conectado'))
redis.on('error', (err) => logger.error({ err }, 'Redis erro'))

export async function connectRedis(): Promise<void> {
  // ioredis conecta automaticamente; aguardamos o evento ready
  await new Promise<void>((resolve, reject) => {
    redis.once('ready', resolve)
    redis.once('error', reject)
  })
  logger.info('Redis pronto')
}