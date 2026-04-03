// Exemplo de rate limiting com Redis

const { getRedis } = require('../config/redis');

const rateLimit = (maxRequests = 100, windowSeconds = 60) => {
  return async (req, res, next) => {
    const redis = getRedis();
    if (!redis) {
      return next();
    }

    const key = `rate-limit:${req.ip}`;

    try {
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      res.set('X-RateLimit-Limit', maxRequests);
      res.set('X-RateLimit-Remaining', Math.max(0, maxRequests - current));

      if (current > maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: windowSeconds
        });
      }

      next();
    } catch (err) {
      console.error('Erro no rate limiting:', err);
      next();
    }
  };
};

module.exports = rateLimit;
