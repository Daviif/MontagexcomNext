import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger } from '../config/logger'

// ================================
// CLASSE DE ERRO DA APLICAÇÃO
// ================================
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// ================================
// HANDLER GLOBAL
// ================================
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Erro de validação Zod
  if (err instanceof ZodError) {
    res.status(422).json({
      code: 'VALIDATION_ERROR',
      message: 'Dados inválidos',
      errors: err.flatten().fieldErrors,
    })
    return
  }

  // Erro de negócio da aplicação
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      code: err.code ?? 'APP_ERROR',
      message: err.message,
    })
    return
  }

  // Erro não mapeado — log completo e resposta genérica
  logger.error({ err, url: req.url, method: req.method }, 'Erro não tratado')

  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Erro interno do servidor',
  })
}