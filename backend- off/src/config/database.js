const { Sequelize } = require('sequelize');

const logging = process.env.DB_LOGGING === 'true';
const useSsl = process.env.DB_SSL === 'true' || Boolean(process.env.DATABASE_URL);

const buildSequelize = () => {
  if (process.env.DATABASE_URL) {
    return new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging,
      dialectOptions: useSsl
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          }
        : undefined
    });
  }

  return new Sequelize({
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging,
    dialectOptions: useSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      : undefined
  });
};

const sequelize = buildSequelize();

module.exports = sequelize;
