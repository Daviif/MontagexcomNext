/**
 * migrate.js — Aplica todas as migrações SQL contra o banco configurado.
 * Uso: node backend/scripts/migrate.js
 *
 * Variáveis obrigatórias (via .env ou ambiente):
 *   DATABASE_URL  — connection string completa (Supabase / outro)
 *   ou DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 */
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
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'Montagex',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    });

// Migrações da pasta raiz /database/migrations (001 em diante)
const ROOT_MIGRATIONS = path.resolve(__dirname, '../../database/migrations');
// Migrações específicas do backend (009, 010)
const BACKEND_MIGRATIONS = path.resolve(__dirname, '../database/migrations');

const FILES = [
  path.join(ROOT_MIGRATIONS, '001_salarios_sistema.sql'),
  path.join(ROOT_MIGRATIONS, '002_add_cnpj_lojas.sql'),
  path.join(ROOT_MIGRATIONS, '003_add_loja_produtos.sql'),
  path.join(ROOT_MIGRATIONS, '004_add_responsavel_despesas.sql'),
  path.join(ROOT_MIGRATIONS, '005_add_codigo_os_loja.sql'),
  path.join(ROOT_MIGRATIONS, '006_add_cliente_final_servicos.sql'),
  path.join(ROOT_MIGRATIONS, '007_unique_servico_montador.sql'),
  path.join(ROOT_MIGRATIONS, '008_rotas_equipe_opcional.sql'),
  path.join(ROOT_MIGRATIONS, '009_add_usuario_perfil.sql'),
  path.join(BACKEND_MIGRATIONS, '009_servico_anexos.sql'),
  path.join(ROOT_MIGRATIONS, '010_add_desconto_servico_produtos.sql'),
  path.join(ROOT_MIGRATIONS, '011_add_percentual_salario_usuarios.sql'),
  path.join(ROOT_MIGRATIONS, '012_allow_usuario_and_equipe_servico_montadores.sql'),
  path.join(ROOT_MIGRATIONS, '013_add_observacoes_recebimentos.sql'),
];

async function runMigrations() {
  const client = await pool.connect();
  try {
    for (const file of FILES) {
      const name = path.basename(file);
      if (!fs.existsSync(file)) {
        console.warn(`⚠️  Arquivo não encontrado, pulando: ${name}`);
        continue;
      }
      const sql = fs.readFileSync(file, 'utf8');
      console.log(`➜  Aplicando ${name}...`);
      try {
        await client.query(sql);
        console.log(`✅  ${name}`);
      } catch (err) {
        // Erros de "já existe" são esperados em re-execuções — apenas avisa
        if (err.code === '42701' || err.code === '42P07' || err.code === '42710') {
          console.log(`⏭️  ${name} — já aplicado (${err.message.split('\n')[0]})`);
        } else {
          throw err;
        }
      }
    }
    console.log('\n✔  Todas as migrações concluídas.');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('❌ Erro nas migrações:', err.message);
  process.exit(1);
});
