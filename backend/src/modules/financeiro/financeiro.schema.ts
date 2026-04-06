import { z } from 'zod'

export const criarTransacaoSchema = z.object({
  osId: z.string().uuid().optional(),
  pessoaId: z.string().uuid(),
  tipoTransacao: z.enum(['ENTRADA', 'SAIDA']),
  categoria: z.string().optional(),
  descricao: z.string().optional(),
  valorTotal: z.number().positive(),
  dataVencimento: z.coerce.date(),
})

export const registrarBaixaSchema = z.object({
  valorPago: z.number().positive(),
  meioPagamento: z.string().optional(),
  observacao: z.string().optional(),
  comprovanteUrl: z.string().url().optional(),
})

export const listarFinanceiroQuerySchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  por_pagina: z.coerce.number().int().min(1).max(100).default(20),
  tipo: z.enum(['ENTRADA', 'SAIDA']).optional(),
  status: z.enum(['ABERTO', 'PARCIAL', 'LIQUIDADO', 'CANCELADO']).optional(),
  pessoa_id: z.string().uuid().optional(),
  os_id: z.string().uuid().optional(),
  vencimento_inicio: z.coerce.date().optional(),
  vencimento_fim: z.coerce.date().optional(),
})