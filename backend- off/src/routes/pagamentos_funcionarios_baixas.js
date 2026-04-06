const express = require('express');
const { models } = require('../models');
const router = express.Router();

// Lista todas as baixas de pagamentos de funcionários
router.get('/', async (req, res, next) => {
  try {
    const baixas = await models.PagamentoFuncionarioBaixa.findAll({
      order: [['data_pagamento', 'ASC'], ['created_at', 'ASC']]
    });
    res.json(baixas);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
