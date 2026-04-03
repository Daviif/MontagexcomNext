const express = require('express');

function createCrudRouter(model, options = {}) {
  const router = express.Router();
  const {
    beforeGetAll,
    afterGetAll,
    beforeGetById,
    afterGetById,
    beforeCreate,
    beforeUpdate,
    beforeDelete
  } = options;

  router.get('/', async (req, res, next) => {
    try {
      if (beforeGetAll) {
        const shouldContinue = await beforeGetAll(req, res);
        if (shouldContinue === false) {
          return;
        }
      }

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

      const results = await model.findAll(options);
      const data = afterGetAll ? await afterGetAll(req, results) : results;
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      if (beforeGetById) {
        const shouldContinue = await beforeGetById(req, res);
        if (shouldContinue === false) {
          return;
        }
      }

      const result = await model.findByPk(req.params.id);
      if (!result) {
        return res.status(404).json({ error: 'Not found' });
      }
      const data = afterGetById ? await afterGetById(req, result) : result;
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      if (beforeCreate) {
        const shouldContinue = await beforeCreate(req, res);
        if (shouldContinue === false) {
          return;
        }
      }

      const created = await model.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      if (beforeUpdate) {
        const shouldContinue = await beforeUpdate(req, res);
        if (shouldContinue === false) {
          return;
        }
      }

      const existing = await model.findByPk(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Not found' });
      }
      const updated = await existing.update(req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      if (beforeDelete) {
        const shouldContinue = await beforeDelete(req, res);
        if (shouldContinue === false) {
          return;
        }
      }

      const existing = await model.findByPk(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Not found' });
      }
      await existing.destroy();
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = createCrudRouter;
