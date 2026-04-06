import { z } from 'zod'

export const itemSchema = z.object({
  produtoId: z.string().uuid().optional(),
  descricaoManual: z.string().optional(),
  quantidade: z.number().int().min(1),
  valorUnitarioNaData: z.number().min(0),
}).refine(
  (d) => d.produtoId || d.descricaoManual,
  { message: 'Informe produtoId ou descricaoManual' },
)

export const executorSchema = z.object({
  colaboradorId: z.string().uuid(),
  percentualParticipacao: z.number().min(0).max(100).default(100),
  ehResponsavel: z.boolean().default(false),
})

export const criarOsSchema = z.object({
  lojaOrigemId: z.string().uuid().optional(),
  clienteDestinoId: z.string().uuid(),
  enderecoExecucaoId: z.string().uuid().optional(),
  dataProgramada: z.coerce.date().optional(),
  observacoes: z.string().optional(),
  itens: z.array(itemSchema).min(1),
  executores: z.array(executorSchema).optional(),
})

export const atualizarStatusSchema = z.object({
  status: z.enum(['AGENDADO', 'EM_DESLOCAMENTO', 'EXECUCAO', 'CONCLUIDO', 'CANCELADO']),
  observacao: z.string().optional(),
})

export const listarOsQuerySchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  por_pagina: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['RASCUNHO','AGENDADO','EM_DESLOCAMENTO','EXECUCAO','CONCLUIDO','CANCELADO']).optional(),
  loja_id: z.string().uuid().optional(),
  cliente_id: z.string().uuid().optional(),
  data_inicio: z.coerce.date().optional(),
  data_fim: z.coerce.date().optional(),
})