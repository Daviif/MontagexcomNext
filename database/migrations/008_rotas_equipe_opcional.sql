-- Migration: Tornar equipe_id opcional na tabela rotas
-- Permite rotas individuais (sem equipe)
-- Data: 2026-02-15

-- Alterar coluna equipe_id para permitir NULL
ALTER TABLE rotas
ALTER COLUMN equipe_id DROP NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN rotas.equipe_id IS 'ID da equipe atribuída (opcional - NULL para rotas individuais)';
