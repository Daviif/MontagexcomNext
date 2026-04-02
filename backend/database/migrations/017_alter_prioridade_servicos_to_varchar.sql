-- Migration: Altera o campo prioridade de integer para varchar na tabela servicos
ALTER TABLE servicos
  ALTER COLUMN prioridade TYPE VARCHAR(20);
