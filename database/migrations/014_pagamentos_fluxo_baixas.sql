-- =====================================================
-- MIGRACAO: Fluxo de contas a pagar e baixas parciais
-- Data: 2026-03-11
-- Descricao: Evolui pagamentos_funcionarios para suportar
--            favorecido/responsavel, categorias, vencimento
--            e historico de baixas (pagamentos parciais)
-- =====================================================

ALTER TABLE pagamentos_funcionarios
ADD COLUMN IF NOT EXISTS categoria VARCHAR(30) DEFAULT 'salario',
ADD COLUMN IF NOT EXISTS origem VARCHAR(30) DEFAULT 'servico',
ADD COLUMN IF NOT EXISTS valor_pago NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_vencimento DATE,
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES usuarios(id);

CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos_funcionarios(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data_vencimento ON pagamentos_funcionarios(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_pagamentos_responsavel ON pagamentos_funcionarios(responsavel_id);

CREATE TABLE IF NOT EXISTS pagamentos_funcionarios_baixas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pagamento_funcionario_id UUID NOT NULL REFERENCES pagamentos_funcionarios(id) ON DELETE CASCADE,
    valor NUMERIC(10,2) NOT NULL,
    data_pagamento DATE NOT NULL,
    forma_pagamento VARCHAR(30),
    observacoes TEXT,
    responsavel_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT now(),
    CHECK (valor > 0)
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_baixas_pagamento ON pagamentos_funcionarios_baixas(pagamento_funcionario_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_baixas_data ON pagamentos_funcionarios_baixas(data_pagamento);
CREATE INDEX IF NOT EXISTS idx_pagamentos_baixas_responsavel ON pagamentos_funcionarios_baixas(responsavel_id);

-- Backfill: pagamentos antigos com status pago passam a ter valor_pago igual ao valor previsto
UPDATE pagamentos_funcionarios
SET valor_pago = COALESCE(valor, 0)
WHERE status = 'pago'
  AND COALESCE(valor_pago, 0) = 0;

-- Backfill: criar uma baixa inicial para registros antigos pagos
INSERT INTO pagamentos_funcionarios_baixas (
    pagamento_funcionario_id,
    valor,
    data_pagamento,
    forma_pagamento,
    observacoes,
    responsavel_id
)
SELECT
    pf.id,
    pf.valor,
    COALESCE(pf.data_pagamento, CURRENT_DATE),
    NULL,
    'Baixa gerada automaticamente na migracao 014',
    pf.responsavel_id
FROM pagamentos_funcionarios pf
WHERE pf.status = 'pago'
  AND pf.valor > 0
  AND NOT EXISTS (
    SELECT 1
    FROM pagamentos_funcionarios_baixas b
    WHERE b.pagamento_funcionario_id = pf.id
  );

-- Backfill: se status estiver vazio, assumir pendente
UPDATE pagamentos_funcionarios
SET status = 'pendente'
WHERE status IS NULL OR TRIM(status) = '';

COMMENT ON COLUMN pagamentos_funcionarios.usuario_id IS 'Favorecido (quem vai receber)';
COMMENT ON COLUMN pagamentos_funcionarios.responsavel_id IS 'Responsavel pelo lancamento/baixa';
COMMENT ON COLUMN pagamentos_funcionarios.valor IS 'Valor previsto da conta a pagar';
COMMENT ON COLUMN pagamentos_funcionarios.valor_pago IS 'Valor total pago ate o momento';
COMMENT ON COLUMN pagamentos_funcionarios.categoria IS 'Categoria financeira: salario, repasse_servico, ajuste, etc';
COMMENT ON COLUMN pagamentos_funcionarios.origem IS 'Origem do pagamento: servico, manual, ajuste';
