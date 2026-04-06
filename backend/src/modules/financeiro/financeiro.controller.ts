import { Request, Response, NextFunction } from 'express'
import * as service from './financeiro.service'
import {
  criarTransacaoSchema,
  registrarBaixaSchema,
  listarFinanceiroQuerySchema,
} from './financeiro.schema'

const firstParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export async function criarTransacao(req: Request, res: Response, next: NextFunction) {
  try {
    const body = criarTransacaoSchema.parse(req.body)
    const transacao = await service.criarTransacao(body)
    res.status(201).json(transacao)
  } catch (err) { next(err) }
}

export async function listar(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listarFinanceiroQuerySchema.parse(req.query)
    const result = await service.listar(query)
    res.json(result)
  } catch (err) { next(err) }
}

export async function registrarBaixa(req: Request, res: Response, next: NextFunction) {
  try {
    const body = registrarBaixaSchema.parse(req.body)
    const baixa = await service.registrarBaixa(firstParam(req.params.id), body)
    res.status(201).json(baixa)
  } catch (err) { next(err) }
}

export async function dashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const resumo = await service.resumoDashboard()
    res.json(resumo)
  } catch (err) { next(err) }
}