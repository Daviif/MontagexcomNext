const express = require('express');
const { models } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * GET /lojas
 * Listar todas as lojas
 */
// Endpoint customizado: retorna lojas com valor de débito/divida calculado
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

    // Busca todas as lojas
    const lojas = await models.Loja.findAll(options);
    // Busca todos os serviços dessas lojas
    const lojaIds = lojas.map(l => l.id);
    const servicos = await models.Servico.findAll({
      where: { loja_id: lojaIds },
      attributes: ['id', 'loja_id', 'valor_total'],
    });
    // Mapeia serviços por loja
    const servicosPorLoja = {};
    servicos.forEach(s => {
      if (!servicosPorLoja[s.loja_id]) servicosPorLoja[s.loja_id] = [];
      servicosPorLoja[s.loja_id].push(s);
    });
    // Busca todos os recebimentos dos serviços dessas lojas
    const servicoIds = servicos.map(s => s.id);
    const recebimentos = await models.Recebimento.findAll({
      where: { servico_id: servicoIds },
      attributes: ['id', 'servico_id', 'valor', 'status'],
    });
    // Mapeia recebimentos por servico
    const recebimentosPorServico = {};
    recebimentos.forEach(r => {
      if (!recebimentosPorServico[r.servico_id]) recebimentosPorServico[r.servico_id] = [];
      recebimentosPorServico[r.servico_id].push(r);
    });

    // Calcula o débito/divida de cada loja
    const lojasComDivida = lojas.map(loja => {
      const servicosLoja = servicosPorLoja[loja.id] || [];
      const totalServicos = servicosLoja.reduce((acc, s) => acc + Number(s.valor_total || 0), 0);
      // Recebimentos pagos
      const totalRecebido = servicosLoja.reduce((acc, s) => {
        const recs = recebimentosPorServico[s.id] || [];
        const pagos = recs.filter(r => r.status === 'pago');
        return acc + pagos.reduce((a, r) => a + Number(r.valor || 0), 0);
      }, 0);
      const divida = totalServicos - totalRecebido;
      // Adiciona campo divida ao objeto
      return {
        ...loja.toJSON(),
        divida,
      };
    });
    res.json(lojasComDivida);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /lojas/:id
 * Buscar loja por ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const result = await models.Loja.findByPk(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /lojas
 * Criar nova loja
 */
router.post('/', async (req, res, next) => {
  try {
    const created = await models.Loja.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /lojas/:id
 * Atualizar loja
 * 
 * Nota: Quando usa_porcentagem ou porcentagem_repasse é alterado,
 * o hook afterUpdate do modelo Loja recalcula automaticamente
 * todos os serviços e montadores.
 */
router.put('/:id', async (req, res, next) => {
  try {
    const lojaAntes = await models.Loja.findByPk(req.params.id);
    if (!lojaAntes) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    // Atualizar loja (hooks cuidam do recálculo automático)
    const lojaAtualizada = await lojaAntes.update(req.body);

    res.json(lojaAtualizada);
  } catch (err) {
    console.error('Erro ao atualizar loja:', err);
    next(err);
  }
});

/**
 * DELETE /lojas/:id
 * Deletar loja
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await models.Loja.findByPk(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    await existing.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
