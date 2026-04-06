import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { prisma } from '../../config/prisma'
import { AppError } from '../../middlewares/error.middleware'
import { env } from '../../config/env'

export type JwtPayload = {
  sub: string        // pessoa.id
  tipo: string       // TipoColaborador
  iat?: number
  exp?: number
}

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  })
}

export function signRefreshToken(sub: string): string {
  return jwt.sign({ sub }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  })
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string }
}

export async function login(documento: string, senha: string) {
  const pessoa = await prisma.pessoa.findFirst({
    where: {
      deletedAt: null,
      ativo: true,
      OR: [{ documento }, { email: documento }],
    },
    include: { colaboradorInfo: true },
  })

  if (!pessoa?.colaboradorInfo?.senhaHash) {
    throw new AppError('Credenciais inválidas', 401, 'UNAUTHORIZED')
  }

  const senhaValida = await bcrypt.compare(senha, pessoa.colaboradorInfo.senhaHash)
  if (!senhaValida) {
    throw new AppError('Credenciais inválidas', 401, 'UNAUTHORIZED')
  }

  const tipo = pessoa.colaboradorInfo.tipoColaborador ?? 'MONTADOR'
  const accessToken = signAccessToken({ sub: pessoa.id, tipo })
  const refreshToken = signRefreshToken(pessoa.id)

  return {
    token: accessToken,
    accessToken,
    refreshToken,
    user: {
      id: pessoa.id,
      nomeRazaoSocial: pessoa.nomeRazaoSocial,
      email: pessoa.email,
      documento: pessoa.documento,
      tipo,
    },
  }
}

export async function refresh(refreshToken: string) {
  const { sub } = verifyRefreshToken(refreshToken)

  const pessoa = await prisma.pessoa.findFirst({
    where: { id: sub, deletedAt: null, ativo: true },
    include: { colaboradorInfo: true },
  })

  if (!pessoa?.colaboradorInfo) {
    throw new AppError('Sessão inválida', 401, 'UNAUTHORIZED')
  }

  const tipo = pessoa.colaboradorInfo.tipoColaborador ?? 'MONTADOR'
  return {
    accessToken: signAccessToken({ sub: pessoa.id, tipo }),
    refreshToken: signRefreshToken(pessoa.id),
  }
}

export async function logout(_sub: string) {
  return
}