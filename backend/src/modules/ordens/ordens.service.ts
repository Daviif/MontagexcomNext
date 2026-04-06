import { prisma } from '../../config/prisma'
import { AppError } from '../../middlewares/error.middleware'
import { emitStatusOS } from '../../config/socket'
import { enqueueNotificacao } from '../../config/queues'
import type { z } from 'zod'
import type {
  criarOsSchema,
  atualizarStatusSchema,
  listarOsQuerySchema,
} from './ordens.schema'

type CriarOs = z.infer<typeof criarOsSchema>
type AtualizarStatus = z.infer<typeof atualizarStatusSchema>
type ListarQuery = z.infer<typeof listarOsQuerySchema>

function gerarCodigoRastreio(): string {
  const data = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const sufixo = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `OS-${data}-${sufixo}`
}

export async function criar(data: CriarOs, criadoPorId: string) {
  const valorTotal = data.itens.reduce(
    (acc, item) => acc + item.valorUnitarioNaData * item.quantidade,
    0,
  )

  const os = await prisma.ordemServico.create({
    data: {
      codigoRastreio: gerarCodigoRastreio(),
      lojaOrigemId: data.lojaOrigemId,
      clienteDestinoId: data.clienteDestinoId,
      enderecoExecucaoId: data.enderecoExecucaoId,
      dataProgramada: data.dataProgramada,
      observacoes: data.observacoes,
      valorVendaTotal: valorTotal,
      itens: {
        create: data.itens.map((item) => ({
          produtoId: item.produtoId,
          descricaoManual: item.descricaoManual,
          quantidade: item.quantidade,
          valorUnitarioNaData: item.valorUnitarioNaData,
        })),
      },
      executores: data.executores
        ? {
            create: data.executores.map((e) => ({
              colaboradorId: e.colaboradorId,
              percentualParticipacao: e.percentualParticipacao,
              ehResponsavel: e.ehResponsavel,
            })),
          }
        : undefined,
      // Histórico inicial gravado via trigger no banco,
      // mas também podemos registrar o criador aqui
      historicoStatus: {
        create: {
          statusNovo: 'RASCUNHO',
          alteradoPorId: criadoPorId,
        },
      },
    },
    include: {
      itens: true,
      executores: true,
      clienteDestino: { select: { id: true, nomeRazaoSocial: true } },
    },
  })

  return os
}

export async function listar(query: ListarQuery) {
  const skip = (query.pagina - 1) * query.por_pagina

  const where = {
    deletedAt: null,
    ...(query.status && { statusFluxo: query.status }),
    ...(query.loja_id && { lojaOrigemId: query.loja_id }),
    ...(query.cliente_id && { clienteDestinoId: query.cliente_id }),
    ...((query.data_inicio || query.data_fim) && {
      dataProgramada: {
        ...(query.data_inicio && { gte: query.data_inicio }),
        ...(query.data_fim && { lte: query.data_fim }),
      },
    }),
  }

  const [dados, total] = await prisma.$transaction([
    prisma.ordemServico.findMany({
      where,
      skip,
      take: query.por_pagina,
      include: {
        clienteDestino: { select: { id: true, nomeRazaoSocial: true, telefone: true } },
        lojaOrigem: { select: { id: true, apelidoFantasia: true } },
        executores: {
          include: {
            colaborador: { select: { id: true, nomeRazaoSocial: true } },
          },
        },
        _count: { select: { itens: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.ordemServico.count({ where }),
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

export async function buscar(id: string) {
  const os = await prisma.ordemServico.findFirst({
    where: { id, deletedAt: null },
    include: {
      itens: { include: { produto: true } },
      executores: {
        include: {
          colaborador: { select: { id: true, nomeRazaoSocial: true, telefone: true } },
        },
      },
      clienteDestino: { include: { enderecos: { where: { deletedAt: null } } } },
      lojaOrigem: { select: { id: true, nomeRazaoSocial: true, apelidoFantasia: true } },
      enderecoExecucao: true,
      historicoStatus: {
        orderBy: { alteradoEm: 'asc' },
        include: {
          alteradoPor: { select: { id: true, nomeRazaoSocial: true } },
        },
      },
      transacoes: {
        where: { deletedAt: null },
        include: { baixas: true },
      },
    },
  })

  if (!os) throw new AppError('Ordem de serviço não encontrada', 404, 'NOT_FOUND')
  return os
}

export async function atualizarStatus(
  id: string,
  data: AtualizarStatus,
  alteradoPorId: string,
) {
  const os = await prisma.ordemServico.findFirst({
    where: { id, deletedAt: null },
  })

  if (!os) throw new AppError('OS não encontrada', 404, 'NOT_FOUND')

  // Validação de transições de status
  const transicoesPermitidas: Record<string, string[]> = {
    RASCUNHO: ['AGENDADO', 'CANCELADO'],
    AGENDADO: ['EM_DESLOCAMENTO', 'CANCELADO'],
    EM_DESLOCAMENTO: ['EXECUCAO', 'CANCELADO'],
    EXECUCAO: ['CONCLUIDO', 'CANCELADO'],
    CONCLUIDO: [],
    CANCELADO: [],
  }

  if (!transicoesPermitidas[os.statusFluxo].includes(data.status)) {
    throw new AppError(
      `Transição de ${os.statusFluxo} para ${data.status} não permitida`,
      422,
      'INVALID_TRANSITION',
    )
  }

  const [osAtualizada] = await prisma.$transaction([
    prisma.ordemServico.update({
      where: { id },
      data: { statusFluxo: data.status },
    }),
    prisma.osHistoricoStatus.create({
      data: {
        osId: id,
        statusAnterior: os.statusFluxo,
        statusNovo: data.status,
        alteradoPorId,
        observacao: data.observacao,
      },
    }),
  ])

  // Notifica em tempo real via Socket.io
  emitStatusOS(id, data.status)

  // Enfileira notificação push/email para o cliente
  await enqueueNotificacao({
    tipo: 'OS_STATUS',
    destinatarioId: os.clienteDestinoId,
    payload: { osId: id, status: data.status, codigoRastreio: os.codigoRastreio },
  })

  return osAtualizada
}

export async function buscarPorRastreio(codigo: string) {
  const os = await prisma.ordemServico.findFirst({
    where: { codigoRastreio: codigo, deletedAt: null },
    select: {
      codigoRastreio: true,
      statusFluxo: true,
      dataProgramada: true,
      enderecoExecucao: true,
      historicoStatus: {
        orderBy: { alteradoEm: 'asc' },
        select: { statusNovo: true, alteradoEm: true },
      },
    },
  })

  if (!os) throw new AppError('Código de rastreio não encontrado', 404, 'NOT_FOUND')
  return os
}