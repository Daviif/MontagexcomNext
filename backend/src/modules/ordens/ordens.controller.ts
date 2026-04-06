import { Request, Response, NextFunction } from 'express'
import * as service from './ordens.service'
import {
  criarOsSchema,
  atualizarStatusSchema,
  listarOsQuerySchema,
} from './ordens.schema'

const firstParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export async function criar(req: Request, res: Response, next: NextFunction) {
  try {
    const body = criarOsSchema.parse(req.body)
    const os = await service.criar(body, req.user!.sub)
    res.status(201).json(os)
  } catch (err) { next(err) }
}

export async function listar(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listarOsQuerySchema.parse(req.query)
    const result = await service.listar(query)
    res.json(result)
  } catch (err) { next(err) }
}

export async function buscar(req: Request, res: Response, next: NextFunction) {
  try {
    const os = await service.buscar(firstParam(req.params.id))
    res.json(os)
  } catch (err) { next(err) }
}

export async function atualizarStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const body = atualizarStatusSchema.parse(req.body)
    const os = await service.atualizarStatus(firstParam(req.params.id), body, req.user!.sub)
    res.json(os)
  } catch (err) { next(err) }
}

export async function rastrear(req: Request, res: Response, next: NextFunction) {
  try {
    const os = await service.buscarPorRastreio(firstParam(req.params.codigo))
    res.json(os)
  } catch (err) { next(err) }
}