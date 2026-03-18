-- =====================================================
-- MIGRAÇÃO 016: Extras / Utilitários por Serviço
-- =====================================================

CREATE TABLE IF NOT EXISTS servico_extras (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    servico_id  UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    descricao   VARCHAR(200) NOT NULL,
    valor       NUMERIC(10,2) NOT NULL DEFAULT 0,
    observacao  TEXT,
    created_at  TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_servico_extras_servico ON servico_extras(servico_id);
