-- Permite registros por membro de equipe em servico_montadores
-- Casos válidos após ajuste:
-- 1) usuario_id preenchido e equipe_id nulo (montador individual)
-- 2) equipe_id preenchido e usuario_id nulo (modelo legado por equipe)
-- 3) usuario_id e equipe_id preenchidos (membro de equipe com percentual por serviço)

ALTER TABLE servico_montadores
  DROP CONSTRAINT IF EXISTS servico_montadores_check;

ALTER TABLE servico_montadores
  ADD CONSTRAINT servico_montadores_check
  CHECK (
    usuario_id IS NOT NULL
    OR equipe_id IS NOT NULL
  );
