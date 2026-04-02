const express = require('express');
const { models } = require('../models');
const Sequelize = require('sequelize');
const { authorizeServicoWrite } = require('../middleware/permissions');

const router = express.Router();

router.use(authorizeServicoWrite);

// GET all servicos
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

    const results = await models.Servico.findAll({
      ...options,
      include: [
        { model: models.Loja, as: 'Loja', attributes: ['id', 'nome_fantasia', 'cnpj', 'endereco'] },
        { model: models.ClienteParticular, as: 'ClienteParticular', attributes: ['id', 'nome', 'endereco'] }
      ]
    });
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET one servico
router.get('/:id', async (req, res, next) => {
  try {
    const result = await models.Servico.findByPk(req.params.id, {
      include: [
        { model: models.Loja, as: 'Loja', attributes: ['id', 'nome_fantasia', 'cnpj', 'endereco', 'email'] },
        { model: models.ClienteParticular, as: 'ClienteParticular', attributes: ['id', 'nome', 'endereco', 'telefone'] },
          { model: models.ServicoProduto, include: [{ model: models.Produto }] },
          { model: models.ServicoMontador, as: 'montadores', include: [{ model: models.Usuario }, { model: models.Equipe }] },
        { model: models.ServicoAnexo, as: 'ServicoAnexos', include: [{ model: models.Usuario, as: 'criador' }] },
      ]
    });
    if (!result) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST (create)
router.post('/', async (req, res, next) => {
  try {
    const created = await models.Servico.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT (update)
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await models.Servico.findByPk(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }
    const updated = await existing.update(req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE with foreign key constraint handling
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await models.Servico.findByPk(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Check if servico is associated with any rotas
    const rotasServicos = await models.RotaServico.findAll({
      where: { servico_id: req.params.id }
    });

    if (rotasServicos.length > 0) {
      return res.status(409).json({
        error: 'Não é possível deletar um serviço que está associado a rotas.',
        message: `Este serviço está associado a ${rotasServicos.length} rota(s). Remova o serviço das rotas antes de deletá-lo.`,
        hasRotas: true,
        rotasCount: rotasServicos.length
      });
    }

    await existing.destroy();
    res.status(204).send();
  } catch (err) {
    // Handle generic foreign key constraint errors
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({
        error: 'Não é possível deletar este serviço.',
        message: 'Este serviço possui referências em outras tabelas. Remova essas associações antes de tentar deletar.',
        hasRotas: true,
        originalError: err.message
      });
    }
    next(err);
  }
});

module.exports = router;
