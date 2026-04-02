-- Migration: Altera o check constraint do campo status na tabela servicos para aceitar 'agendada' e outros valores
ALTER TABLE servicos
  DROP CONSTRAINT IF EXISTS servicos_status_check;

ALTER TABLE servicos
  ALTER COLUMN status TYPE VARCHAR(20);

ALTER TABLE servicos
  ADD CONSTRAINT servicos_status_check CHECK (status IN ('agendada','agendado','em_rota','concluido','cancelado'));
