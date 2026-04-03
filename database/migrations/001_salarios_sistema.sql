-- =====================================================
-- MIGRAÇÃO: Sistema de Salários e Repasse
-- Data: 2026-02-13
-- Descrição: Adiciona suporte a cálculo de salários,
--            atribuição de valores a montadores/equipes
--            e configuração de porcentagem por loja
-- =====================================================

-- 1. CRIAR TABELA DE CONFIGURAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descricao TEXT,
    tipo VARCHAR(50), -- 'texto', 'numero', 'percentual', 'formula'
    updated_at TIMESTAMP DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO configuracoes (chave, valor, descricao, tipo) VALUES
('salario_formula', 'valor_montagem', 'Fórmula para cálculo de salário: valor_montagem, valor_montagem * 1.1, etc', 'formula'),
('salario_base_padrao', '0', 'Valor base adicional ao salário (além das montagens)', 'numero')
ON CONFLICT (chave) DO NOTHING;

-- 2. ADICIONAR CAMPOS EM LOJAS
-- =====================================================

ALTER TABLE lojas 
ADD COLUMN IF NOT EXISTS usa_porcentagem BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS porcentagem_repasse NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS observacoes_pagamento TEXT;

COMMENT ON COLUMN lojas.usa_porcentagem IS 'Se true, o repasse é calculado como % do valor do móvel';
COMMENT ON COLUMN lojas.porcentagem_repasse IS 'Percentual de repasse (ex: 5.00 = 5%)';
COMMENT ON COLUMN lojas.observacoes_pagamento IS 'Observações sobre acordo de pagamento';

-- 3. ADICIONAR CAMPO EM SERVICOS
-- =====================================================

ALTER TABLE servicos 
ADD COLUMN IF NOT EXISTS valor_repasse_montagem NUMERIC(10,2);

COMMENT ON COLUMN servicos.valor_repasse_montagem IS 'Valor total que será distribuído aos montadores';

-- 4. CRIAR TABELA SERVICO_MONTADORES
-- =====================================================

CREATE TABLE IF NOT EXISTS servico_montadores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    
    -- Pode ser montador individual OU equipe
    usuario_id UUID REFERENCES usuarios(id),
    equipe_id UUID REFERENCES equipes(id),
    
    -- Valor atribuído a este montador/equipe
    valor_atribuido NUMERIC(10,2) NOT NULL,
    percentual_divisao NUMERIC(5,2), -- Percentual dentro do serviço (ex: 70% principal, 30% auxiliar)
    
    papel VARCHAR(20) CHECK (papel IN ('principal','auxiliar')),
    
    created_at TIMESTAMP DEFAULT now(),
    
    CHECK (
        (usuario_id IS NOT NULL AND equipe_id IS NULL)
        OR
        (equipe_id IS NOT NULL AND usuario_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_servico_montadores_servico ON servico_montadores(servico_id);
CREATE INDEX IF NOT EXISTS idx_servico_montadores_usuario ON servico_montadores(usuario_id);
CREATE INDEX IF NOT EXISTS idx_servico_montadores_equipe ON servico_montadores(equipe_id);

COMMENT ON TABLE servico_montadores IS 'Relaciona serviços com montadores/equipes e valores atribuídos';
COMMENT ON COLUMN servico_montadores.usuario_id IS 'Montador individual (mutuamente exclusivo com equipe_id)';
COMMENT ON COLUMN servico_montadores.equipe_id IS 'Equipe (mutuamente exclusivo com usuario_id)';
COMMENT ON COLUMN servico_montadores.valor_atribuido IS 'Valor que este montador/equipe receberá';
COMMENT ON COLUMN servico_montadores.percentual_divisao IS 'Percentual da divisão do serviço';

-- =====================================================
-- MIGRAÇÃO COMPLETA
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Migração concluída com sucesso!';
    RAISE NOTICE 'Tabelas criadas/atualizadas:';
    RAISE NOTICE '  - configuracoes (nova)';
    RAISE NOTICE '  - lojas (campos adicionados)';
    RAISE NOTICE '  - servicos (campo adicionado)';
    RAISE NOTICE '  - servico_montadores (nova)';
END $$;
