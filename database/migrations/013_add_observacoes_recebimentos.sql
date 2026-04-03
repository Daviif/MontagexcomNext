-- Adiciona campo de observacoes para recebimentos
ALTER TABLE recebimentos
ADD COLUMN IF NOT EXISTS observacoes TEXT;
