// Exemplo completo: rota de criar serviço com todas as funcionalidades

const express = require('express');
const { servicoValidators, uuidParamValidator } = require('../validators');
const { models } = require('../models');
const authMiddleware = require('../middleware/auth');
const { cacheRoute, invalidateCache } = require('../middleware/cache');
const { emitirServicoAtualizado } = require('../utils/websocket');

const router = express.Router();
const { Servico, Produto, Usuario } = models;

// GET /servicos com cache
router.get(
  '/',
  cacheRoute((req) => `api:servicos:${JSON.stringify(req.query)}`, 300),
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

      const resultados = await Servico.findAll(options);
      res.json(resultados);
    } catch (err) {
      next(err);
    }
  }
);

// POST /servicos com validação completa
router.post(
  '/',
  authMiddleware,                    // Verificar JWT
  servicoValidators.create,          // Validar input
  async (req, res, next) => {
    try {
      const { userId, userType } = req.user;

      // Regra de negócio: apenas admins podem criar serviços para lojas
      if (req.body.tipo_cliente === 'loja' && userType !== 'admin') {
        return res.status(403).json({
          error: 'Apenas administradores podem criar serviços para lojas'
        });
      }

      // Criar serviço
      const servico = await Servico.create({
        ...req.body,
        criado_por: userId
      });

      // Buscar dados associados
      const servicoCompleto = await Servico.findByPk(servico.id, {
        include: [
          { model: Produto, through: { attributes: [] } },
          { model: Usuario, attributes: ['nome', 'email'] }
        ]
      });

      // Invalidar cache de listagem
      await invalidateCache('api:servicos:*');

      // Emitir evento em tempo real
      const io = req.app.get('io');
      if (io) {
        emitirServicoAtualizado(io, servico.id, {
          action: 'created',
          data: servicoCompleto.toJSON()
        });
      }

      // Notificar administradores
      if (io) {
        io.emit('notificacao', {
          titulo: 'Novo Serviço',
          mensagem: `Serviço #${servico.id.substring(0, 8)} criado`,
          tipo: 'info',
          timestamp: new Date().toISOString()
        });
      }

      res.status(201).json(servicoCompleto);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /servicos/:id com validação e invalidação de cache
router.put(
  '/:id',
  authMiddleware,
  uuidParamValidator,
  servicoValidators.update,
  async (req, res, next) => {
    try {
      const servico = await Servico.findByPk(req.params.id);

      if (!servico) {
        return res.status(404).json({ error: 'Serviço não encontrado' });
      }

      // Regra: não permitir mudança de cliente
      if (req.body.tipo_cliente && req.body.tipo_cliente !== servico.tipo_cliente) {
        return res.status(400).json({
          error: 'Não é possível alterar o tipo de cliente de um serviço'
        });
      }

      // Atualizar
      await servico.update(req.body);

      // Invalidar caches
      await invalidateCache(`servico:${req.params.id}`);
      await invalidateCache('api:servicos:*');

      // Emitir evento
      const io = req.app.get('io');
      if (io) {
        emitirServicoAtualizado(io, req.params.id, {
          action: 'updated',
          data: servico.toJSON()
        });
      }

      res.json(servico);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /servicos/:id
router.delete(
  '/:id',
  authMiddleware,
  uuidParamValidator,
  async (req, res, next) => {
    try {
      const servico = await Servico.findByPk(req.params.id);

      if (!servico) {
        return res.status(404).json({ error: 'Serviço não encontrado' });
      }

      // Regra: não permitir deletar serviço concluso
      if (servico.status === 'concluido') {
        return res.status(400).json({
          error: 'Não é possível deletar um serviço concluído'
        });
      }

      await servico.destroy();

      // Invalidar caches
      await invalidateCache(`servico:${req.params.id}`);
      await invalidateCache('api:servicos:*');

      // Emitir evento
      const io = req.app.get('io');
      if (io) {
        io.emit('notificacao', {
          titulo: 'Serviço Deletado',
          mensagem: `Serviço #${req.params.id.substring(0, 8)} foi removido`,
          tipo: 'warning'
        });
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
