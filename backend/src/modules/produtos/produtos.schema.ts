import { z } from 'zod'

const booleanFromAny = z.preprocess((value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const v = value.toLowerCase()
    if (v === 'true') return true
    if (v === 'false') return false
  }
  return value
}, z.boolean())

export const listarProdutosQuerySchema = z.object({
  busca: z.string().optional(),
  ativo: booleanFromAny.optional(),
  loja_id: z.string().uuid().optional(),
})

export const criarProdutoSchema = z.object({
  nome: z.string().min(2),
  categoria: z.string().optional(),
  loja_id: z.string().uuid().optional(),
  lojaId: z.string().uuid().optional(),
  codigo: z.union([z.string(), z.number()]).optional(),
  skuExterno: z.string().optional(),
  valor_base: z.coerce.number().positive().optional(),
  valorMontagemBase: z.coerce.number().positive().optional(),
  tempo_base_min: z.coerce.number().int().min(1).optional(),
  tempoEstimadoMinutos: z.coerce.number().int().min(1).optional(),
  ativo: booleanFromAny.optional().default(true),
}).refine((data) => Boolean(data.loja_id || data.lojaId), {
  message: 'loja_id (ou lojaId) é obrigatório',
  path: ['loja_id'],
}).refine((data) => Boolean(data.valor_base ?? data.valorMontagemBase), {
  message: 'valor_base (ou valorMontagemBase) é obrigatório',
  path: ['valor_base'],
})

export const atualizarProdutoSchema = z.object({
  nome: z.string().min(2).optional(),
  categoria: z.string().optional(),
  codigo: z.union([z.string(), z.number()]).optional(),
  skuExterno: z.string().optional(),
  valor_base: z.coerce.number().positive().optional(),
  valorMontagemBase: z.coerce.number().positive().optional(),
  tempo_base_min: z.coerce.number().int().min(1).optional(),
  tempoEstimadoMinutos: z.coerce.number().int().min(1).optional(),
  ativo: booleanFromAny.optional(),
})
