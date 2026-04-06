import { z } from 'zod'

export const enderecoSchema = z.object({
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export const criarClienteSchema = z.object({
  nomeRazaoSocial: z.string().min(2),
  apelidoFantasia: z.string().optional(),
  documento: z.string().optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  endereco: enderecoSchema.optional(),
})

export const criarColaboradorSchema = z.object({
  nomeRazaoSocial: z.string().min(2),
  documento: z.string().min(11),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  tipoColaborador: z.enum(['ADMIN', 'MONTADOR']),
  senha: z.string().min(8),
  chavePix: z.string().optional(),
  comissaoPadrao: z.number().min(0).max(100).default(50),
  metaMensal: z.number().min(0).default(0),
})

export const criarLojaSchema = z.object({
  nomeRazaoSocial: z.string().min(2),
  apelidoFantasia: z.string().optional(),
  documento: z.string().optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  endereco: enderecoSchema.optional(),
})

export const atualizarPessoaSchema = z.object({
  nomeRazaoSocial: z.string().min(2).optional(),
  apelidoFantasia: z.string().optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  ativo: z.boolean().optional(),
})

export const listarQuerySchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  por_pagina: z.coerce.number().int().min(1).max(100).default(20),
  busca: z.string().optional(),
  ativo: z.coerce.boolean().optional(),
})