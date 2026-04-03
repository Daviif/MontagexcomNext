-- Adiciona percentual de salario por usuario (montador/admin)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS percentual_salario NUMERIC(5,2) DEFAULT 50;

UPDATE usuarios
SET percentual_salario = 50
WHERE percentual_salario IS NULL;
