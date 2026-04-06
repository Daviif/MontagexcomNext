### ⚡ Redis Cache

Redis é utilizado para cache de dados frequentemente acessados, melhorando significativamente o desempenho da API.

#### Configuração

**Arquivo**: `src/config/redis.js`

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # opcional
REDIS_DB=0
```

#### Middleware de Cache

##### Cache Global em GET requests

```javascript
const { cacheMiddleware } = require('./middleware/cache');

// Cache de 5 minutos (300s) para todas as requisições GET
app.use(cacheMiddleware(300));
```

##### Cache em Rotas Específicas

```javascript
const { cacheRoute } = require('./middleware/cache');

router.get('/usuarios', cacheRoute('usuarios:list', 300), async (req, res) => {
  // ...
});

// Cache com chave dinâmica
router.get(
  '/usuarios/:id',
  cacheRoute((req) => `usuario:${req.params.id}`, 3600),
  async (req, res) => {
    // ...
  }
);
```

#### Funções Utilitárias

**Arquivo**: `src/utils/cache.js`

##### Set Cache

```javascript
const { setCache } = require('./utils/cache');

// Cachear por 1 hora (3600 segundos)
await setCache('dashboard:stats', statsData, 3600);
```

##### Get Cache

```javascript
const { getCache } = require('./utils/cache');

const data = await getCache('dashboard:stats');
if (data) {
  console.log('Dados do cache:', data);
}
```

##### Get ou Set (Padrão Comum)

```javascript
const { getOrSet } = require('./utils/cache');

const usuarios = await getOrSet(
  'usuarios:all',
  () => Usuario.findAll(),
  300
);
```

##### Invalida Cache

```javascript
const { clearCachePattern, delCache } = require('./utils/cache');

// Deletar uma chave específica
await delCache('dashboard:stats');

// Deletar todas as chaves que correspondem ao padrão
await clearCachePattern('usuario:*');
await clearCachePattern('api:usuarios:*');
```

#### Contadores e Rate Limiting

```javascript
const { incrCounter, getCounter, resetCounter } = require('./utils/cache');

// Incrementar contador (ideal para rate limiting)
const currentCount = await incrCounter(`requests:${ip}`, 3600);

if (currentCount > 100) {
  return res.status(429).json({ error: 'Too many requests' });
}

// Obter valor do contador
const totalRequests = await getCounter(`requests:${ip}`);

// Resetar contador
await resetCounter(`requests:${ip}`);
```

#### Exemplo Completo: Cachear Relatórios

```javascript
const express = require('express');
const { getOrSet, clearCachePattern } = require('./utils/cache');

const router = express.Router();

// GET relatório com cache
router.get('/relatorio/:type', async (req, res, next) => {
  try {
    const cacheKey = `relatorio:${req.params.type}:${JSON.stringify(req.query)}`;
    
    const relatorio = await getOrSet(cacheKey, async () => {
      // Simular operação pesada
      const dados = await Servico.findAll({
        where: req.query,
        raw: true
      });
      
      return {
        total: dados.length,
        dados: dados
      };
    }, 1800); // Cache de 30 minutos

    res.json(relatorio);
  } catch (err) {
    next(err);
  }
});

// POST invalidar cache após mudança
router.post('/servicos', async (req, res, next) => {
  try {
    const servico = await Servico.create(req.body);

    // Invalidar relatórios cacheados
    await clearCachePattern('relatorio:*');

    res.status(201).json(servico);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

#### Estratégias de Cache

##### 1. Cache-Aside (Lazy Loading)

```javascript
const { getOrSet } = require('./utils/cache');

const usuarios = await getOrSet('usuarios:all', () =>
  Usuario.findAll(),
  300
);
```

##### 2. Write-Through

```javascript
async function criarUsuario(dados) {
  const usuario = await Usuario.create(dados);
  
  // Cachear imediatamente
  await setCache(`usuario:${usuario.id}`, usuario, 3600);
  
  // Invalidar lista
  await clearCachePattern('usuarios:*');
  
  return usuario;
}
```

##### 3. TTL com Renovação

```javascript
async function acessarDado(key) {
  const dados = await getCache(key);
  
  if (dados) {
    // Renovar TTL ao acessar
    await setCache(key, dados, 1800);
  }
  
  return dados;
}
```

#### Monitoramento

Para ver padrões de cache no logs:

```
[Cache] Hit: usuario:123
[Cache] Miss: usuario:456
[Cache] Set: usuario:789 (3600s)
[Cache] Deleted: usuarios:*
```

#### Performance

Tipicamente, Redis cache reduz latência em:
- Listagens: **10-50ms → 1-5ms**
- Relatórios: **500-2000ms → 50-500ms**
- Dashboard: **1-3s → 100-300ms**

#### Troubleshooting

**Redis não conectado?**
```
Redis não está acessível. Cache desabilitado.
```
- A API continua funcionando sem cache
- Tente: `redis-cli ping`

**Dados obsoletos?**
- Ajuste TTL para valores menores
- Invalide cache manualmente após mudanças críticas

**Memória Redis alta?**
- Configure eviction policy: `maxmemory-policy allkeys-lru`
- Reduza TTLs
- Use padrões de invalidação mais agressivos
