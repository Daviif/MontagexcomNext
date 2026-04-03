-- Script de verificação e correção para o serviço DULAR

-- 1. Verificar configuração da loja DULAR
SELECT 
    id,
    nome,
    nome_fantasia,
    cnpj,
    usa_porcentagem,
    porcentagem_repasse
FROM lojas 
WHERE nome_fantasia = 'DULAR' OR razao_social LIKE '%DULAR%' OR cnpj LIKE '%01704320001416%';

-- 2. Verificar serviços da loja DULAR em fevereiro 2026
SELECT 
    s.id,
    s.codigo_os_loja,
    s.data_servico,
    s.valor_total,
    s.valor_repasse_montagem,
    s.status,
    l.nome_fantasia as loja,
    l.porcentagem_repasse
FROM servicos s
LEFT JOIN lojas l ON s.loja_id = l.id
WHERE s.data_servico >= '2026-02-01' 
  AND s.data_servico < '2026-03-01'
  AND (l.nome_fantasia = 'DULAR' OR l.cnpj LIKE '%01704320001416%')
ORDER BY s.data_servico;

-- 3. Verificar montadores duplicados para esses serviços
SELECT 
    sm.servico_id,
    s.codigo_os_loja,
    sm.usuario_id,
    u.nome as montador,
    COUNT(*) as quantidade_registros,
    SUM(sm.valor_atribuido) as soma_valores
FROM servico_montadores sm
JOIN servicos s ON sm.servico_id = s.id
JOIN usuarios u ON sm.usuario_id = u.id
JOIN lojas l ON s.loja_id = l.id
WHERE s.data_servico >= '2026-02-01' 
  AND s.data_servico < '2026-03-01'
  AND (l.nome_fantasia = 'DULAR' OR l.cnpj LIKE '%01704320001416%')
GROUP BY sm.servico_id, s.codigo_os_loja, sm.usuario_id, u.nome
HAVING COUNT(*) > 1;

-- 4. Mostrar todos os registros de servico_montadores para fevereiro
SELECT 
    sm.id,
    s.codigo_os_loja,
    s.data_servico,
    u.nome as montador,
    sm.valor_atribuido,
    sm.papel,
    sm.percentual_divisao,
    s.valor_total,
    s.valor_repasse_montagem,
    l.porcentagem_repasse
FROM servico_montadores sm
JOIN servicos s ON sm.servico_id = s.id
JOIN usuarios u ON sm.usuario_id = u.id
LEFT JOIN lojas l ON s.loja_id = l.id
WHERE s.data_servico >= '2026-02-01' 
  AND s.data_servico < '2026-03-01'
ORDER BY s.data_servico, u.nome;
