import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, type JwtPayload } from '../modules/auth/auth.utils'
import { AppError } from './error.middleware'

type TipoColaborador = 'ADMIN' | 'MONTADOR'

// Extende o tipo do Request para carregar o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

// ================================
// GUARD DE AUTENTICAÇÃO
// ================================
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Token não fornecido', 401, 'UNAUTHORIZED'))
  }

  const token = header.slice(7)

  try {
    req.user = verifyAccessToken(token)
    next()
  } catch {
    next(new AppError('Token inválido ou expirado', 401, 'UNAUTHORIZED'))
  }
}

// ================================
// GUARD DE PERFIL
// ================================
export function authorize(...tipos: TipoColaborador[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Não autenticado', 401, 'UNAUTHORIZED'))
    }

    if (!tipos.includes(req.user.tipo as TipoColaborador)) {
      return next(new AppError('Permissão insuficiente', 403, 'FORBIDDEN'))
    }

    next()
  }
}