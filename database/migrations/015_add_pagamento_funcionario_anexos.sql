-- Migration 015: Tabela de anexos/comprovantes de pagamentos de funcionários
CREATE TABLE IF NOT EXISTS pagamento_funcionario_anexos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pagamento_funcionario_id UUID NOT NULL REFERENCES pagamentos_funcionarios(id) ON DELETE CASCADE,
  nome_arquivo VARCHAR(255) NOT NULL,
  extensao VARCHAR(20),
  tipo_mime VARCHAR(100),
  tamanho_bytes BIGINT,
  caminho_arquivo TEXT NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  criado_por UUID REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_pagamento_funcionario_anexos_pagamento_id
  ON pagamento_funcionario_anexos(pagamento_funcionario_id);
