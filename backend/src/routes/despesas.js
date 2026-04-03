
const express = require('express');
const { models } = require('../models');
const Sequelize = require('sequelize');
const { authorizeServicoWrite } = require('../middleware/permissions');

const router = express.Router();

router.use(authorizeServicoWrite);

router.get('/', async (req, res, next) => {
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

    const despesas = await models.Despesa.findAll(options);

    // Resumo por categoria
    const despesasPorCategoria = await models.Despesa.findAll({
      attributes: [
        'categoria',
        [Sequelize.fn('SUM', Sequelize.col('valor')), 'total']
      ],
      where: filters,
      group: ['categoria']
    });

    res.json({
      despesas,
      resumoPorCategoria: despesasPorCategoria
    });
  } catch (err) {
    next(err);
  }
});

// Criar nova despesa
router.post('/', async (req, res, next) => {
  try {
    const despesa = await models.Despesa.create(req.body);
    res.status(201).json(despesa);
  } catch (err) {
    next(err);
  }
});

// Atualizar despesa existente
router.put('/:id', async (req, res, next) => {
  try {
    const despesa = await models.Despesa.findByPk(req.params.id);
    if (!despesa) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }
    await despesa.update(req.body);
    res.json(despesa);
  } catch (err) {
    next(err);
  }
});

// Deletar despesa
router.delete('/:id', async (req, res, next) => {
  try {
    const despesa = await models.Despesa.findByPk(req.params.id);
    if (!despesa) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }
    await despesa.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;