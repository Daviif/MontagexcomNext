const express = require('express');
const { models } = require('../models');
const Sequelize = require('sequelize');
const { authorizeServicoWrite } = require('../middleware/permissions');

const router = express.Router();

router.use(authorizeServicoWrite);

router.get('/:id_servico', async (req, res, next) => {
  try {
    const montadores = await models.ServicoMontador.findAll({
      where: { servico_id: req.params.id_servico },
      include: [
        { model: models.Usuario },
        { model: models.Equipe }
      ]
    });
    res.json(montadores);
  } catch (err) {
    next(err);
  }
});

// Deleta todos os montadores vinculados a um serviço (por servico_id)
router.delete('/:id_servico', async (req, res, next) => {
  try {
    const deleted = await models.ServicoMontador.destroy({
      where: { servico_id: req.params.id_servico }
    });
    if (deleted === 0) {
      return res.status(404).json({ error: 'Nenhum ServicoMontador encontrado para este serviço' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;