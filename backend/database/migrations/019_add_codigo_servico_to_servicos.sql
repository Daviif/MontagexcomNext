-- Migration: Adiciona a coluna codigo_os_loja na tabela servicos
ALTER TABLE servicos
  ADD COLUMN codigo_os_loja VARCHAR(50);