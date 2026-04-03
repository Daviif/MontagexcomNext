-- Migration 006: Adicionar campos de cliente final nos serviços
-- Quando o serviço é para uma loja, armazena informações do cliente que comprou na loja

ALTER TABLE servicos
ADD COLUMN cliente_final_nome TEXT,
ADD COLUMN cliente_final_contato VARCHAR(50),
ADD COLUMN codigo_os_loja VARCHAR(50);

COMMENT ON COLUMN servicos.cliente_final_nome IS 'Nome do cliente final que comprou na loja';
COMMENT ON COLUMN servicos.cliente_final_contato IS 'Telefone/contato do cliente final';
COMMENT ON COLUMN servicos.codigo_os_loja IS 'Código da ordem de serviço da loja';

-- Criar índice para buscar por código OS da loja
CREATE INDEX idx_servicos_codigo_os_loja ON servicos(codigo_os_loja);
