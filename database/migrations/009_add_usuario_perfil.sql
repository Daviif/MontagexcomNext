-- Adiciona campos opcionais de perfil no usuário
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS foto_perfil TEXT,
  ADD COLUMN IF NOT EXISTS chave_pix TEXT,
  ADD COLUMN IF NOT EXISTS data_nascimento DATE,
  ADD COLUMN IF NOT EXISTS habilitacao TEXT,
  ADD COLUMN IF NOT EXISTS meta_mensal NUMERIC(10,2);
