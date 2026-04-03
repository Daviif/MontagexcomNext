const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'Montagex',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../database/migrations/009_servico_anexos.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executando migração 009_servico_anexos.sql...');
    await pool.query(sql);
    console.log('✅ Migração executada com sucesso!');
    console.log('   - Tabela servico_anexos criada');
    
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
