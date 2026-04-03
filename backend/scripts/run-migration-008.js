const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'Montagex',
  user: 'postgres',
  password: '33624055'
});

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../database/migrations/008_rotas_equipe_opcional.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executando migração 008_rotas_equipe_opcional.sql...');
    await pool.query(sql);
    console.log('✅ Migração executada com sucesso!');
    console.log('   - equipe_id agora aceita NULL na tabela rotas');
    
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
