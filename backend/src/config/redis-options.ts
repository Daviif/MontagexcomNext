import type { RedisOptions } from 'ioredis'
import { env } from './env'

const usaTlsNoRedisUrl = (): boolean => {
  if (!env.REDIS_URL) return false

  try {
    return new URL(env.REDIS_URL).protocol === 'rediss:'
  } catch {
    return env.REDIS_URL.startsWith('rediss://')
  }
}

export const redisConnectionOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...(usaTlsNoRedisUrl() ? { tls: {} } : {}),
}
