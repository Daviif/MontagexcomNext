import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma'
import { logger } from './logger'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' })

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect()
  logger.info('PostgreSQL conectado via Prisma')
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
  logger.info('PostgreSQL desconectado')
}