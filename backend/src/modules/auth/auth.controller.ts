import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as authService from './auth.service'

const loginSchema = z.object({
  documento: z.string().min(1),
  senha: z.string().min(6),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.parse(req.body)
    const result = await authService.login(body.documento, body.senha)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = refreshSchema.parse(req.body)
    const result = await authService.refresh(refreshToken)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.user!.sub)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function me(req: Request, res: Response) {
  res.json({ user: req.user })
}