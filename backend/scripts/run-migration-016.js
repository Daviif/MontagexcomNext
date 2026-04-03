require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { require: true, rejectUnauthorized: false }
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'Montagex',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    });

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../database/migrations/016_add_servico_extras.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executando migração 016_add_servico_extras.sql...');
    await pool.query(sql);
    console.log('✅ Migração executada com sucesso!');
    console.log('   - Tabela servico_extras criada');
    console.log('   - Índice idx_servico_extras_servico criado');
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
