// Exemplo de router com validações integradas

const express = require('express');
const createCrudRouter = require('../routes/crudRouter');
const { usuarioValidators, uuidParamValidator, paginationValidator } = require('../validators');
const { models } = require('../models');

const router = express.Router();
const { Usuario } = models;

// GET com validação de query params
router.get(
  '/',
  paginationValidator,
  async (req, res, next) => {
    try {
      const { limit, offset, orderBy, orderDir, ...filters } = req.query;
      const options = { where: filters };

      if (limit) {
        options.limit = Math.min(Number(limit), 200);
      }
      if (offset) {
        options.offset = Number(offset);
      }
      if (orderBy) {
        options.order = [[orderBy, orderDir && orderDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']];
      }

      const results = await Usuario.findAll(options);
      res.json(results);
    } catch (err) {
      next(err);
    }
  }
);

// GET por ID com validação
router.get(
  '/:id',
  uuidParamValidator,
  async (req, res, next) => {
    try {
      const result = await Usuario.findByPk(req.params.id);
      if (!result) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST com validação
router.post(
  '/',
  usuarioValidators.create,
  async (req, res, next) => {
    try {
      const created = await Usuario.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }
);

// PUT com validação
router.put(
  '/:id',
  uuidParamValidator,
  usuarioValidators.update,
  async (req, res, next) => {
    try {
      const existing = await Usuario.findByPk(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Not found' });
      }
      const updated = await existing.update(req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE
router.delete(
  '/:id',
  uuidParamValidator,
  async (req, res, next) => {
    try {
      const existing = await Usuario.findByPk(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Not found' });
      }
      await existing.destroy();
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
