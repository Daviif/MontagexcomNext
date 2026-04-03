require('dotenv').config();

const bcrypt = require('bcryptjs');
const { sequelize, models } = require('../models');

const { Usuario } = models;

const getEnv = (key, fallback) => {
  const value = process.env[key];
  return value === undefined || value === '' ? fallback : value;
};

const seedAdmin = async () => {
  const adminEmail = getEnv('ADMIN_EMAIL', 'admin@montagex.local');
  const adminPassword = getEnv('ADMIN_PASSWORD', 'admin123');
  const adminName = getEnv('ADMIN_NAME', 'Administrador');

  if (!adminEmail || !adminPassword) {
    console.error('ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios para o seed.');
    process.exit(1);
  }

  const existingAdmin = await Usuario.findOne({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log('Admin já existe. Nenhuma ação necessária.');
    return;
  }

  const senhaHash = await bcrypt.hash(adminPassword, 10);

  await Usuario.create({
    nome: adminName,
    email: adminEmail,
    senha_hash: senhaHash,
    tipo: 'admin',
    ativo: true
  });

  console.log('Admin criado com sucesso.');
};

const run = async () => {
  try {
    await sequelize.authenticate();
    await seedAdmin();
  } catch (err) {
    console.error('Erro ao executar seed:', err.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  run();
}

module.exports = seedAdmin;
