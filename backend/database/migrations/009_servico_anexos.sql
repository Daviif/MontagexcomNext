-- Tabela de anexos de serviços
CREATE TABLE servico_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  nome_arquivo VARCHAR(255) NOT NULL,
  extensao VARCHAR(20),
  tipo_mime VARCHAR(100),
  tamanho_bytes BIGINT,
  caminho_arquivo TEXT NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  criado_por UUID,
  
  CONSTRAINT fk_servico_anexos_usuario FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_servico_anexos_servico_id ON servi co_anexos(servico_id);
CREATE INDEX idx_servico_anexos_criado_em ON servico_anexos(criado_em DESC);
