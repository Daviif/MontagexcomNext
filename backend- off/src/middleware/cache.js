const { getRedis } = require('../config/redis');

// Middleware de cache genérico
function cacheMiddleware(ttl = 300) {
  return async (req, res, next) => {
    // Apenas cachear GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const redis = getRedis();
    if (!redis) {
      return next();
    }

    const cacheKey = `api:${req.path}:${JSON.stringify(req.query)}`;

    try {
      const cached = await redis.get(cacheKey);

      if (cached) {
        console.log(`[Cache] Hit: ${cacheKey}`);
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      console.error('Erro ao acessar cache:', err);
    }

    // Interceptar res.json para cachear resposta
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      try {
        redis.setex(cacheKey, ttl, JSON.stringify(data));
        console.log(`[Cache] Set: ${cacheKey} (${ttl}s)`);
      } catch (err) {
        console.error('Erro ao cachear:', err);
      }

      return originalJson(data);
    };

    next();
  };
}

// Cache apenas para rotas específicas
function cacheRoute(key, ttl = 300) {
  return async (req, res, next) => {
    const redis = getRedis();
    if (!redis) {
      return next();
    }

    const cacheKey = typeof key === 'function' ? key(req) : key;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`[Cache] Hit: ${cacheKey}`);
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      console.error('Erro ao acessar cache:', err);
    }

    const originalJson = res.json.bind(res);
    res.json = function(data) {
      try {
        redis.setex(cacheKey, ttl, JSON.stringify(data));
        console.log(`[Cache] Set: ${cacheKey} (${ttl}s)`);
      } catch (err) {
        console.error('Erro ao cachear:', err);
      }

      return originalJson(data);
    };

    next();
  };
}

// Invalidar cache
async function invalidateCache(pattern) {
  const redis = getRedis();
  if (!redis) return;

  try {
    redis.keys(pattern, async (err, keys) => {
      if (err || !keys.length) return;

      keys.forEach((key) => {
        redis.del(key);
        console.log(`[Cache] Invalidated: ${key}`);
      });
    });
  } catch (err) {
    console.error('Erro ao invalidar cache:', err);
  }
}

module.exports = {
  cacheMiddleware,
  cacheRoute,
  invalidateCache
};
