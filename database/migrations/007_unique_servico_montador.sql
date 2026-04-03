-- Migration 007: Adicionar constraint unique para evitar duplicação de montadores no mesmo serviço

-- Primeiro, remover duplicatas existentes (manter apenas a mais recente de cada combinação)
DELETE FROM servico_montadores a
USING servico_montadores b
WHERE a.id < b.id
  AND a.servico_id = b.servico_id
  AND a.usuario_id = b.usuario_id
  AND a.usuario_id IS NOT NULL;

-- Adicionar constraint UNIQUE para evitar duplicatas futuras
ALTER TABLE servico_montadores
ADD CONSTRAINT unique_servico_usuario 
UNIQUE (servico_id, usuario_id);

COMMENT ON CONSTRAINT unique_servico_usuario ON servico_montadores IS 
'Garante que o mesmo montador não seja adicionado mais de uma vez ao mesmo serviço';
