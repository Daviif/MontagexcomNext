// Dashboard estatísticas em tempo real com Redis

const { getCounter, incrCounter, resetCounter } = require('../utils/cache');
const { getRedis } = require('../config/redis');

class DashboardStats {
  constructor() {
    this.redis = getRedis();
  }

  // Incrementar contador de requisições
  async recordRequest(endpoint) {
    const today = new Date().toISOString().split('T')[0];
    const key = `stats:requests:${endpoint}:${today}`;
    return await incrCounter(key, 86400); // 24h
  }

  // Incrementar contador de erros
  async recordError(endpoint) {
    const today = new Date().toISOString().split('T')[0];
    const key = `stats:errors:${endpoint}:${today}`;
    return await incrCounter(key, 86400);
  }

  // Registrar tempo de resposta
  async recordResponseTime(endpoint, ms) {
    const key = `stats:response_time:${endpoint}`;
    
    if (!this.redis) return;

    try {
      // Usar ZADD para manter histórico com score (timestamp)
      await this.redis.zadd(
        `${key}:history`,
        Date.now(),
        ms.toString()
      );

      // Manter apenas últimas 1000 medições
      await this.redis.zremrangebyrank(`${key}:history`, 0, -1001);

      // Calcular média
      const values = await this.redis.zrange(`${key}:history`, 0, -1);
      const avg = values.reduce((a, b) => a + parseInt(b), 0) / values.length;

      await this.redis.set(`${key}:avg`, avg.toFixed(2));
    } catch (err) {
      console.error('Erro ao registrar tempo de resposta:', err);
    }
  }

  // Obter statistícas do dia
  async getStatsToday() {
    const today = new Date().toISOString().split('T')[0];
    
    if (!this.redis) return {};

    try {
      const endpoints = [
        'usuarios',
        'servicos',
        'rotas',
        'equipes'
      ];

      const stats = {
        date: today,
        endpoints: {}
      };

      for (const endpoint of endpoints) {
        const reqKey = `stats:requests:${endpoint}:${today}`;
        const errKey = `stats:errors:${endpoint}:${today}`;
        const timeKey = `stats:response_time:${endpoint}:avg`;

        const requests = await this.redis.get(reqKey) || '0';
        const errors = await this.redis.get(errKey) || '0';
        const avgTime = await this.redis.get(timeKey) || '0';

        stats.endpoints[endpoint] = {
          requests: parseInt(requests),
          errors: parseInt(errors),
          errorRate: requests > 0 ? ((errors / requests) * 100).toFixed(2) : 0,
          avgResponseTime: `${avgTime}ms`
        };
      }

      return stats;
    } catch (err) {
      console.error('Erro ao obter stats:', err);
      return {};
    }
  }

  // Reset daily stats
  async resetDailyStats() {
    if (!this.redis) return;

    try {
      const keys = await this.redis.keys('stats:*');
      for (const key of keys) {
        await this.redis.del(key);
      }
    } catch (err) {
      console.error('Erro ao resetar stats:', err);
    }
  }
}

module.exports = new DashboardStats();
