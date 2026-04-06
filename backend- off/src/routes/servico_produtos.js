const express = require('express');
const { models } = require('../models');
const Sequelize = require('sequelize');
const { authorizeServicoWrite } = require('../middleware/permissions');

const router = express.Router();

router.use(authorizeServicoWrite);

router.get('/:id_servico', async (req, res, next) => {
  try {
    const produtos = await models.ServicoProduto.findAll({
      where: { servico_id: req.params.id_servico },
      include: [
        { model: models.Produto }
      ]
    });
    res.json(produtos);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id_servico', async (req, res, next) => {
  try {
    await models.ServicoProduto.destroy({
      where: { servico_id: req.params.id_servico }
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;