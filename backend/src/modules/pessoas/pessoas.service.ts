import bcrypt from 'bcrypt'
import { prisma } from '../../config/prisma'
import { AppError } from '../../middlewares/error.middleware'
import type {
  criarClienteSchema,
  criarColaboradorSchema,
  criarLojaSchema,
  atualizarPessoaSchema,
  listarQuerySchema,
} from './pessoas.schema'
import type { z } from 'zod'

type CriarCliente = z.infer<typeof criarClienteSchema>
type CriarColaborador = z.infer<typeof criarColaboradorSchema>
type CriarLoja = z.infer<typeof criarLojaSchema>
type AtualizarPessoa = z.infer<typeof atualizarPessoaSchema>
type ListarQuery = z.infer<typeof listarQuerySchema>

// ================================
// CLIENTES
// ================================

export async function criarCliente(data: CriarCliente) {
  return prisma.pessoa.create({
    data: {
      tipoPessoa: 'CLIENTE_FINAL',
      nomeRazaoSocial: data.nomeRazaoSocial,
      apelidoFantasia: data.apelidoFantasia,
      documento: data.documento,
      email: data.email,
      telefone: data.telefone,
      enderecos: data.endereco
        ? { create: data.endereco }
        : undefined,
    },
    include: { enderecos: true },
  })
}

export async function listarClientes(query: ListarQuery) {
  const skip = (query.pagina - 1) * query.por_pagina

  const where = {
    tipoPessoa: 'CLIENTE_FINAL' as const,
    deletedAt: null,
    ...(query.busca && {
      OR: [
        { nomeRazaoSocial: { contains: query.busca, mode: 'insensitive' as const } },
        { documento: { contains: query.busca } },
        { email: { contains: query.busca, mode: 'insensitive' as const } },
      ],
    }),
    ...(query.ativo !== undefined && { ativo: query.ativo }),
  }

  const [dados, total] = await prisma.$transaction([
    prisma.pessoa.findMany({
      where,
      skip,
      take: query.por_pagina,
      include: { enderecos: { where: { deletedAt: null } } },
      orderBy: { nomeRazaoSocial: 'asc' },
    }),
    prisma.pessoa.count({ where }),
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

export async function buscarCliente(id: string) {
  const cliente = await prisma.pessoa.findFirst({
    where: { id, tipoPessoa: 'CLIENTE_FINAL', deletedAt: null },
    include: {
      enderecos: { where: { deletedAt: null } },
      ordensComoCliente: {
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, codigoRastreio: true, statusFluxo: true, createdAt: true },
      },
    },
  })

  if (!cliente) throw new AppError('Cliente não encontrado', 404, 'NOT_FOUND')
  return cliente
}

// ================================
// COLABORADORES
// ================================

export async function criarColaborador(data: CriarColaborador) {
  const existe = await prisma.pessoa.findFirst({ where: { documento: data.documento } })
  if (existe) throw new AppError('Documento já cadastrado', 409, 'CONFLICT')

  const senhaHash = await bcrypt.hash(data.senha, 12)

  return prisma.pessoa.create({
    data: {
      tipoPessoa: 'USUARIO',
      nomeRazaoSocial: data.nomeRazaoSocial,
      documento: data.documento,
      email: data.email,
      telefone: data.telefone,
      colaboradorInfo: {
        create: {
          tipoColaborador: data.tipoColaborador,
          senhaHash,
          chavePix: data.chavePix,
          comissaoPadrao: data.comissaoPadrao,
          metaMensal: data.metaMensal,
        },
      },
    },
    include: {
      colaboradorInfo: {
        select: {
          tipoColaborador: true,
          chavePix: true,
          comissaoPadrao: true,
          metaMensal: true,
          // senhaHash NUNCA é retornado
        },
      },
    },
  })
}

export async function listarColaboradores(query: ListarQuery) {
  const skip = (query.pagina - 1) * query.por_pagina

  const where = {
    tipoPessoa: 'USUARIO' as const,
    deletedAt: null,
    ...(query.busca && {
      nomeRazaoSocial: { contains: query.busca, mode: 'insensitive' as const },
    }),
    ...(query.ativo !== undefined && { ativo: query.ativo }),
  }

  const [dados, total] = await prisma.$transaction([
    prisma.pessoa.findMany({
      where,
      skip,
      take: query.por_pagina,
      include: {
        colaboradorInfo: {
          select: {
            tipoColaborador: true,
            comissaoPadrao: true,
            metaMensal: true,
          },
        },
      },
      orderBy: { nomeRazaoSocial: 'asc' },
    }),
    prisma.pessoa.count({ where }),
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

// ================================
// LOJAS
// ================================

export async function criarLoja(data: CriarLoja) {
  return prisma.pessoa.create({
    data: {
      tipoPessoa: 'LOJA',
      nomeRazaoSocial: data.nomeRazaoSocial,
      apelidoFantasia: data.apelidoFantasia,
      documento: data.documento,
      email: data.email,
      telefone: data.telefone,
      enderecos: data.endereco ? { create: data.endereco } : undefined,
    },
    include: { enderecos: true },
  })
}

// ================================
// OPERAÇÕES COMUNS
// ================================

export async function atualizar(id: string, data: AtualizarPessoa) {
  const pessoa = await prisma.pessoa.findFirst({ where: { id, deletedAt: null } })
  if (!pessoa) throw new AppError('Pessoa não encontrada', 404, 'NOT_FOUND')

  return prisma.pessoa.update({ where: { id }, data })
}

export async function remover(id: string) {
  const pessoa = await prisma.pessoa.findFirst({ where: { id, deletedAt: null } })
  if (!pessoa) throw new AppError('Pessoa não encontrada', 404, 'NOT_FOUND')

  // Soft delete
  await prisma.pessoa.update({
    where: { id },
    data: { deletedAt: new Date(), ativo: false },
  })
}