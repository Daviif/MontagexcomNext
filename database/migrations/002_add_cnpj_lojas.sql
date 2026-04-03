-- =====================================================
-- MIGRACAO: Campos CNPJ e razao social em lojas
-- Data: 2026-02-13
-- =====================================================

ALTER TABLE lojas
ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18),
ADD COLUMN IF NOT EXISTS razao_social VARCHAR(150),
ADD COLUMN IF NOT EXISTS nome_fantasia VARCHAR(150);

CREATE INDEX IF NOT EXISTS idx_lojas_cnpj ON lojas(cnpj);
