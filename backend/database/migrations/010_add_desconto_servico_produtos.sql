-- Adiciona suporte a desconto por item em servico_produtos
ALTER TABLE servico_produtos
  ADD COLUMN IF NOT EXISTS utilizar_desconto BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS valor_desconto NUMERIC(10,2) DEFAULT 0;

UPDATE servico_produtos
SET utilizar_desconto = FALSE,
    valor_desconto = COALESCE(valor_desconto, 0)
WHERE utilizar_desconto IS NULL
   OR valor_desconto IS NULL;