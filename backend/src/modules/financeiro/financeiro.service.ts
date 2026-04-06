import { prisma } from '../../config/prisma'
import { AppError } from '../../middlewares/error.middleware'
import type { z } from 'zod'
import type {
  criarTransacaoSchema,
  registrarBaixaSchema,
  listarFinanceiroQuerySchema,
} from './financeiro.schema'

type CriarTransacao = z.infer<typeof criarTransacaoSchema>
type RegistrarBaixa = z.infer<typeof registrarBaixaSchema>
type ListarQuery = z.infer<typeof listarFinanceiroQuerySchema>

export async function criarTransacao(data: CriarTransacao) {
  return prisma.financeiroTransacao.create({
    data: {
      osId: data.osId,
      pessoaId: data.pessoaId,
      tipoTransacao: data.tipoTransacao,
      categoria: data.categoria,
      descricao: data.descricao,
      valorTotal: data.valorTotal,
      dataVencimento: data.dataVencimento,
    },
  })
}

export async function listar(query: ListarQuery) {
  const skip = (query.pagina - 1) * query.por_pagina

  const where = {
    deletedAt: null,
    ...(query.tipo && { tipoTransacao: query.tipo }),
    ...(query.status && { statusPagamento: query.status }),
    ...(query.pessoa_id && { pessoaId: query.pessoa_id }),
    ...(query.os_id && { osId: query.os_id }),
    ...((query.vencimento_inicio || query.vencimento_fim) && {
      dataVencimento: {
        ...(query.vencimento_inicio && { gte: query.vencimento_inicio }),
        ...(query.vencimento_fim && { lte: query.vencimento_fim }),
      },
    }),
  }

  const [dados, total] = await prisma.$transaction([
    prisma.financeiroTransacao.findMany({
      where,
      skip,
      take: query.por_pagina,
      include: {
        pessoa: { select: { id: true, nomeRazaoSocial: true } },
        baixas: true,
        ordemServico: { select: { codigoRastreio: true } },
      },
      orderBy: { dataVencimento: 'asc' },
    }),
    prisma.financeiroTransacao.count({ where }),
  ])

  return {
    dados,
    paginacao: {
      total,
      pagina: query.pagina,
      por_pagina: query.por_pagina,
      total_paginas: Math.ceil(total / query.por_pagina),
    },
  }
}

export async function registrarBaixa(transacaoId: string, data: RegistrarBaixa) {
  const transacao = await prisma.financeiroTransacao.findFirst({
    where: { id: transacaoId, deletedAt: null },
    include: { baixas: true },
  })

  if (!transacao) throw new AppError('Transação não encontrada', 404, 'NOT_FOUND')

  if (transacao.statusPagamento === 'LIQUIDADO') {
    throw new AppError('Transação já liquidada', 422, 'ALREADY_PAID')
  }

  if (transacao.statusPagamento === 'CANCELADO') {
    throw new AppError('Transação cancelada', 422, 'CANCELLED')
  }

  const totalPagoAte = transacao.baixas.reduce(
    (acc, b) => acc + Number(b.valorPago),
    0,
  )
  const restante = Number(transacao.valorTotal) - totalPagoAte

  if (data.valorPago > restante) {
    throw new AppError(
      `Valor excede o saldo restante de R$ ${restante.toFixed(2)}`,
      422,
      'EXCEEDS_BALANCE',
    )
  }

  const novoPago = totalPagoAte + data.valorPago
  const novoStatus =
    novoPago >= Number(transacao.valorTotal)
      ? 'LIQUIDADO'
      : novoPago > 0
        ? 'PARCIAL'
        : 'ABERTO'

  const [baixa] = await prisma.$transaction([
    prisma.financeiroBaixa.create({
      data: {
        transacaoId,
        valorPago: data.valorPago,
        meioPagamento: data.meioPagamento,
        observacao: data.observacao,
        comprovanteUrl: data.comprovanteUrl,
      },
    }),
    prisma.financeiroTransacao.update({
      where: { id: transacaoId },
      data: { statusPagamento: novoStatus },
    }),
  ])

  return baixa
}

export async function resumoDashboard() {
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

  const [entradas, saidas, vencendoHoje, osAbertas] = await prisma.$transaction([
    prisma.financeiroTransacao.aggregate({
      where: {
        tipoTransacao: 'ENTRADA',
        statusPagamento: 'LIQUIDADO',
        dataVencimento: { gte: inicioMes, lte: fimMes },
        deletedAt: null,
      },
      _sum: { valorTotal: true },
    }),
    prisma.financeiroTransacao.aggregate({
      where: {
        tipoTransacao: 'SAIDA',
        statusPagamento: 'LIQUIDADO',
        dataVencimento: { gte: inicioMes, lte: fimMes },
        deletedAt: null,
      },
      _sum: { valorTotal: true },
    }),
    prisma.financeiroTransacao.count({
      where: {
        statusPagamento: { in: ['ABERTO', 'PARCIAL'] },
        dataVencimento: { lte: hoje },
        deletedAt: null,
      },
    }),
    prisma.ordemServico.count({
      where: {
        statusFluxo: { in: ['AGENDADO', 'EM_DESLOCAMENTO', 'EXECUCAO'] },
        deletedAt: null,
      },
    }),
  ])

  return {
    mes: { inicioMes, fimMes },
    entradas: Number(entradas._sum.valorTotal ?? 0),
    saidas: Number(saidas._sum.valorTotal ?? 0),
    saldo: Number(entradas._sum.valorTotal ?? 0) - Number(saidas._sum.valorTotal ?? 0),
    vencendoHoje,
    osAbertas,
  }
}