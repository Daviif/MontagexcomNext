import { z } from 'zod'

const envSchema = z.object({
  // Servidor
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Banco de dados
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),

  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(16, 'JWT_SECRET deve ter pelo menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET deve ter pelo menos 16 caracteres'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Storage
  STORAGE_ENDPOINT: z.string().default('http://localhost:9000'),
  STORAGE_ACCESS_KEY: z.string().default('minioadmin'),
  STORAGE_SECRET_KEY: z.string().default('minioadmin'),
  STORAGE_BUCKET: z.string().default('comprovantes'),
  STORAGE_USE_SSL: z.coerce.boolean().default(false),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌  Variáveis de ambiente inválidas:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export type Env = typeof env