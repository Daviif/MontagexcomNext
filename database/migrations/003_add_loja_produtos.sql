-- =====================================================
-- MIGRACAO: Produtos por loja
-- Data: 2026-02-13
-- =====================================================

ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_produtos_loja_nome ON produtos(loja_id, nome);
CREATE INDEX IF NOT EXISTS idx_produtos_loja ON produtos(loja_id);
