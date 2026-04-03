-- =====================================================
-- MIGRAÇÃO: Responsável em despesas
-- Data: 2026-02-13
-- Descrição: Adiciona vínculo de responsável (montador) em despesas
-- =====================================================

ALTER TABLE despesas
ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES usuarios(id);

CREATE INDEX IF NOT EXISTS idx_despesas_responsavel ON despesas(responsavel_id);

COMMENT ON COLUMN despesas.responsavel_id IS 'Usuário responsável pela despesa (montador)';

DO $$
BEGIN
    RAISE NOTICE 'Migração concluída: despesas.responsavel_id';
END $$;
