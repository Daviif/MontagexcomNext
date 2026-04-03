const { getRedis } = require('../config/redis');

// Set com TTL
async function setCache(key, value, ttl = 300) {
  const redis = getRedis();
  if (!redis) return null;

  try {
    await redis.setex(key, ttl, JSON.stringify(value));
    console.log(`[Cache] Set: ${key} (${ttl}s)`);
    return value;
  } catch (err) {
    console.error('Erro ao cachear:', err);
    return null;
  }
}

// Get com parsing automático
async function getCache(key) {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const cached = await redis.get(key);
    if (cached) {
      console.log(`[Cache] Hit: ${key}`);
      return JSON.parse(cached);
    }
    console.log(`[Cache] Miss: ${key}`);
    return null;
  } catch (err) {
    console.error('Erro ao recuperar cache:', err);
    return null;
  }
}

// Delete cache
async function delCache(key) {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.del(key);
    console.log(`[Cache] Deleted: ${key}`);
    return true;
  } catch (err) {
    console.error('Erro ao deletar cache:', err);
    return false;
  }
}

// Clear pattern (ex: 'api:usuarios:*')
async function clearCachePattern(pattern) {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    return new Promise((resolve, reject) => {
      redis.keys(pattern, async (err, keys) => {
        if (err) {
          reject(err);
          return;
        }

        if (!keys || keys.length === 0) {
          resolve(0);
          return;
        }

        let deleted = 0;
        for (const key of keys) {
          await redis.del(key);
          deleted++;
          console.log(`[Cache] Deleted: ${key}`);
        }

        resolve(deleted);
      });
    });
  } catch (err) {
    console.error('Erro ao limpar cache:', err);
    return 0;
  }
}

// Get ou fazer fetch se não estiver cacheado
async function getOrSet(key, fetchFn, ttl = 300) {
  let cached = await getCache(key);

  if (cached) {
    return cached;
  }

  const data = await fetchFn();
  await setCache(key, data, ttl);
  return data;
}

// Incr contador (para rate limiting, estatísticas)
async function incrCounter(key, ttl = 3600) {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const count = await redis.incr(key);

    // Se for a primeira vez, setar TTL
    if (count === 1) {
      await redis.expire(key, ttl);
    }

    return count;
  } catch (err) {
    console.error('Erro ao incrementar contador:', err);
    return null;
  }
}

// Get contador
async function getCounter(key) {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    const value = await redis.get(key);
    return value ? parseInt(value) : 0;
  } catch (err) {
    console.error('Erro ao obter contador:', err);
    return 0;
  }
}

// Reset contador
async function resetCounter(key) {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.del(key);
    console.log(`[Counter] Reset: ${key}`);
    return true;
  } catch (err) {
    console.error('Erro ao resetar contador:', err);
    return false;
  }
}

module.exports = {
  setCache,
  getCache,
  delCache,
  clearCachePattern,
  getOrSet,
  incrCounter,
  getCounter,
  resetCounter
};
