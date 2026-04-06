import { Request, Response, NextFunction } from 'express'
import * as service from './pessoas.service'
import {
  criarClienteSchema,
  criarColaboradorSchema,
  criarLojaSchema,
  atualizarPessoaSchema,
  listarQuerySchema,
} from './pessoas.schema'

const firstParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

// ================================
// CLIENTES
// ================================

export async function criarCliente(req: Request, res: Response, next: NextFunction) {
  try {
    const body = criarClienteSchema.parse(req.body)
    const cliente = await service.criarCliente(body)
    res.status(201).json(cliente)
  } catch (err) { next(err) }
}

export async function listarClientes(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listarQuerySchema.parse(req.query)
    const result = await service.listarClientes(query)
    res.json(result)
  } catch (err) { next(err) }
}

export async function buscarCliente(req: Request, res: Response, next: NextFunction) {
  try {
    const cliente = await service.buscarCliente(firstParam(req.params.id))
    res.json(cliente)
  } catch (err) { next(err) }
}

// ================================
// COLABORADORES
// ================================

export async function criarColaborador(req: Request, res: Response, next: NextFunction) {
  try {
    const body = criarColaboradorSchema.parse(req.body)
    const colaborador = await service.criarColaborador(body)
    res.status(201).json(colaborador)
  } catch (err) { next(err) }
}

export async function listarColaboradores(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listarQuerySchema.parse(req.query)
    const result = await service.listarColaboradores(query)
    res.json(result)
  } catch (err) { next(err) }
}

// ================================
// LOJAS
// ================================

export async function criarLoja(req: Request, res: Response, next: NextFunction) {
  try {
    const body = criarLojaSchema.parse(req.body)
    const loja = await service.criarLoja(body)
    res.status(201).json(loja)
  } catch (err) { next(err) }
}

// ================================
// OPERAÇÕES COMUNS
// ================================

export async function atualizar(req: Request, res: Response, next: NextFunction) {
  try {
    const body = atualizarPessoaSchema.parse(req.body)
    const pessoa = await service.atualizar(firstParam(req.params.id), body)
    res.json(pessoa)
  } catch (err) { next(err) }
}

export async function remover(req: Request, res: Response, next: NextFunction) {
  try {
    await service.remover(firstParam(req.params.id))
    res.status(204).send()
  } catch (err) { next(err) }
}