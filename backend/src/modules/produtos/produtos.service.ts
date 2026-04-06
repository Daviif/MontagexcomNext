import { prisma } from '../../config/prisma'
import { AppError } from '../../middlewares/error.middleware'
import type { z } from 'zod'
import type {
  listarProdutosQuerySchema,
  criarProdutoSchema,
  atualizarProdutoSchema,
} from './produtos.schema'

type ListarProdutosQuery = z.infer<typeof listarProdutosQuerySchema>
type CriarProdutoInput = z.infer<typeof criarProdutoSchema>
type AtualizarProdutoInput = z.infer<typeof atualizarProdutoSchema>

const numeroCodigo = (skuExterno: string | null): number => {
  if (!skuExterno) return 0
  const digits = skuExterno.replace(/\D/g, '')
  const asNumber = Number(digits)
  return Number.isFinite(asNumber) ? asNumber : 0
}

const mapProduto = (produto: {
  id: string
  lojaId: string
  skuExterno: string | null
  nome: string
  valorMontagemBase: unknown
  tempoEstimadoMinutos: number
  deletedAt: Date | null
  createdAt: Date
}) => ({
  id: produto.id,
  loja_id: produto.lojaId,
  lojaId: produto.lojaId,
  codigo: numeroCodigo(produto.skuExterno),
  skuExterno: produto.skuExterno,
  nome: produto.nome,
  categoria: 'Diversos',
  valor_base: Number(produto.valorMontagemBase),
  tempo_base_min: produto.tempoEstimadoMinutos,
  ativo: produto.deletedAt === null,
  created_at: produto.createdAt,
})

export async function listar(query: ListarProdutosQuery) {
  const produtos = await prisma.produto.findMany({
    where: {
      ...(query.busca
        ? {
            OR: [
              { nome: { contains: query.busca, mode: 'insensitive' } },
              { skuExterno: { contains: query.busca, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.loja_id ? { lojaId: query.loja_id } : {}),
      ...(query.ativo === true ? { deletedAt: null } : {}),
      ...(query.ativo === false ? { deletedAt: { not: null } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return { data: produtos.map(mapProduto) }
}

export async function criar(data: CriarProdutoInput) {
  const produto = await prisma.produto.create({
    data: {
      lojaId: data.loja_id ?? data.lojaId!,
      skuExterno: data.skuExterno ?? (data.codigo !== undefined ? String(data.codigo) : null),
      nome: data.nome,
      valorMontagemBase: data.valor_base ?? data.valorMontagemBase!,
      tempoEstimadoMinutos: data.tempo_base_min ?? data.tempoEstimadoMinutos ?? 60,
      deletedAt: data.ativo === false ? new Date() : null,
    },
  })

  return mapProduto(produto)
}

export async function atualizar(id: string, data: AtualizarProdutoInput) {
  const existente = await prisma.produto.findFirst({ where: { id } })
  if (!existente) {
    throw new AppError('Produto não encontrado', 404, 'NOT_FOUND')
  }

  const produto = await prisma.produto.update({
    where: { id },
    data: {
      ...(data.nome !== undefined ? { nome: data.nome } : {}),
      ...(data.skuExterno !== undefined ? { skuExterno: data.skuExterno } : {}),
      ...(data.codigo !== undefined ? { skuExterno: String(data.codigo) } : {}),
      ...(data.valor_base !== undefined ? { valorMontagemBase: data.valor_base } : {}),
      ...(data.valorMontagemBase !== undefined ? { valorMontagemBase: data.valorMontagemBase } : {}),
      ...(data.tempo_base_min !== undefined ? { tempoEstimadoMinutos: data.tempo_base_min } : {}),
      ...(data.tempoEstimadoMinutos !== undefined ? { tempoEstimadoMinutos: data.tempoEstimadoMinutos } : {}),
      ...(data.ativo !== undefined ? { deletedAt: data.ativo ? null : new Date() } : {}),
    },
  })

  return mapProduto(produto)
}
