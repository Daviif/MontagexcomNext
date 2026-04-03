const redis = require('redis');

let client = null;

async function initRedis() {
  try {
    client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: Number(process.env.REDIS_DB) || 0,
      retry_strategy: function(options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.warn('Redis não está acessível. Cache desabilitado.');
          return;
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    client.on('error', (err) => {
      console.error('Erro Redis:', err);
    });

    client.on('connect', () => {
      console.log('✅ Redis conectado');
    });

    return client;
  } catch (err) {
    console.error('Erro ao conectar Redis:', err);
    return null;
  }
}

function getRedis() {
  return client;
}

module.exports = {
  initRedis,
  getRedis
};
