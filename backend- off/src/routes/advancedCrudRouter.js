// Exemplo de CRUD router que emite eventos Socket.io
// Este é um exemplo avançado. Para a maioria dos casos, o crudRouter.js é suficiente.

const express = require('express');
const { emitirServicoAtualizado } = require('../utils/websocket');

function createAdvancedCrudRouter(model, eventNamespace) {
  const router = express.Router();

  router.post('/', async (req, res, next) => {
    try {
      const created = await model.create(req.body);
      
      // Emitir evento de criação
      const io = req.app.get('io');
      if (io) {
        io.emit(`${eventNamespace}:criado`, {
          id: created.id,
          data: created.toJSON(),
          timestamp: new Date().toISOString()
        });
      }

      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const existing = await model.findByPk(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Not found' });
      }

      const updated = await existing.update(req.body);

      // Emitir evento de atualização
      const io = req.app.get('io');
      if (io) {
        io.emit(`${eventNamespace}:atualizado`, {
          id: updated.id,
          data: updated.toJSON(),
          timestamp: new Date().toISOString()
        });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const existing = await model.findByPk(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Not found' });
      }

      await existing.destroy();

      // Emitir evento de deleção
      const io = req.app.get('io');
      if (io) {
        io.emit(`${eventNamespace}:deletado`, {
          id: req.params.id,
          timestamp: new Date().toISOString()
        });
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = createAdvancedCrudRouter;
