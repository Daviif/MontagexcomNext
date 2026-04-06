// Exemplo de router com cache

const express = require('express');
const { cacheRoute, invalidateCache } = require('../middleware/cache');
const { getOrSet, setCache, getCache } = require('../utils/cache');
const { models } = require('../models');

const router = express.Router();
const { Usuario, Servico, Rota } = models;

// GET usuários com cache de 5 minutos
router.get(
  '/',
  cacheRoute((req) => `api:usuarios:${JSON.stringify(req.query)}`, 300),
  async (req, res, next) => {
    try {
      const usuarios = await Usuario.findAll(req.query);
      res.json(usuarios);
    } catch (err) {
      next(err);
    }
  }
);

// GET usuário específico com cache
router.get('/:id', async (req, res, next) => {
  try {
    const cacheKey = `usuario:${req.params.id}`;
    
    const usuario = await getOrSet(cacheKey, () =>
      Usuario.findByPk(req.params.id),
      3600 // 1 hora
    );

    if (!usuario) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(usuario);
  } catch (err) {
    next(err);
  }
});

// POST - Invalidar cache relacionado
router.post('/', async (req, res, next) => {
  try {
    const usuario = await Usuario.create(req.body);

    // Invalidar cache de listagem
    await invalidateCache('api:usuarios:*');

    res.status(201).json(usuario);
  } catch (err) {
    next(err);
  }
});

// PUT - Atualizar e invalidar cache
router.put('/:id', async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Not found' });
    }

    const updated = await usuario.update(req.body);

    // Invalidar caches relacionados
    await invalidateCache(`usuario:${req.params.id}`);
    await invalidateCache('api:usuarios:*');

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
