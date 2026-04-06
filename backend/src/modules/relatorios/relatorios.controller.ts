import { Request, Response, NextFunction } from 'express'
import * as service from './relatorios.service'
import { solicitarRelatorioSchema } from './relatorios.schema'

export async function solicitar(req: Request, res: Response, next: NextFunction) {
  try {
    const body = solicitarRelatorioSchema.parse(req.body)
    const result = await service.solicitarRelatorio(body, req.user!.sub)
    res.status(202).json(result)
  } catch (err) {
    next(err)
  }
}
