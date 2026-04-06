import { Request, Response, NextFunction } from 'express'
import * as service from './produtos.service'
import {
  listarProdutosQuerySchema,
  criarProdutoSchema,
  atualizarProdutoSchema,
} from './produtos.schema'

const firstParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export async function listar(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listarProdutosQuerySchema.parse(req.query)
    const result = await service.listar(query)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function criar(req: Request, res: Response, next: NextFunction) {
  try {
    const body = criarProdutoSchema.parse(req.body)
    const produto = await service.criar(body)
    res.status(201).json(produto)
  } catch (err) {
    next(err)
  }
}

export async function atualizar(req: Request, res: Response, next: NextFunction) {
  try {
    const body = atualizarProdutoSchema.parse(req.body)
    const produto = await service.atualizar(firstParam(req.params.id), body)
    res.json(produto)
  } catch (err) {
    next(err)
  }
}
