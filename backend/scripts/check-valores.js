const { Client } = require('pg');
require('dotenv').config();

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('Conectado ao banco\n');
    
    const result = await client.query(`
      SELECT 
        s.codigo_os_loja,
        s.valor_total,
        s.valor_repasse_montagem,
        u.nome as montador,
        sm.valor_atribuido,
        l.nome_fantasia as loja,
        l.porcentagem_repasse
      FROM servicos s
      JOIN servico_montadores sm ON sm.servico_id = s.id
      JOIN usuarios u ON u.id = sm.usuario_id
      JOIN lojas l ON l.id = s.loja_id
      WHERE l.nome_fantasia = 'DULAR'
      ORDER BY s.data_servico DESC
      LIMIT 5
    `);
    
    console.log('=== VALORES ATUALIZADOS NO BANCO ===\n');
    result.rows.forEach(r => {
      console.log(`Loja: ${r.loja} (${r.porcentagem_repasse}%)`);
      console.log(`Serviço: ${r.codigo_os_loja}`);
      console.log(`Valor Total: R$ ${r.valor_total}`);
      console.log(`Valor Repasse (${r.porcentagem_repasse}%): R$ ${r.valor_repasse_montagem}`);
      console.log(`Montador: ${r.montador}`);
      console.log(`Valor Atribuído: R$ ${r.valor_atribuido}`);
      console.log('-------------------------------------------\n');
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await client.end();
  }
})();
