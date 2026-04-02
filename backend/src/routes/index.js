const express = require('express');
const createCrudRouter = require('./crudRouter');
const authMiddleware = require('../middleware/auth');
const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const dashboardSalariosRoutes = require('./dashboardSalarios');
const lojasRoutes = require('./lojas');
const servicosRoutes = require('./servicos');
const anexosRoutes = require('./anexos');
const perfilRoutes = require('./perfil');
const despesasRoutes = require('./despesas');

const createPagamentosFuncionariosRouter = require('./pagamentosFuncionarios');
const {
  requireAdmin,
  authorizeResource,
  filterPagamentosForMontador,
  sanitizePagamentosResponse,
  validatePagamentoOwnership,
  sanitizePagamentoById
} = require('../middleware/permissions');
const { models } = require('../models');

const router = express.Router();

// Rota para listar todas as baixas de pagamentos de funcionários
const pagamentosFuncionariosBaixasRoutes = require('./pagamentos_funcionarios_baixas');
router.use('/pagamentos_funcionarios_baixas', pagamentosFuncionariosBaixasRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rotas públicas de autenticação
router.use('/auth', authRoutes);

// Middleware de autenticação para todas as outras rotas
router.use(authMiddleware);

// Rotas de dashboard
router.use('/dashboard/salarios', requireAdmin('Apenas administradores podem acessar salários'), dashboardSalariosRoutes);
router.use('/dashboard', dashboardRoutes);

router.use('/despesas', despesasRoutes);
// Perfil do usuário autenticado
router.use('/perfil', perfilRoutes);

// Rota customizada de lojas (com recálculo automático)
router.use('/lojas', authorizeResource('lojas'), lojasRoutes);

// Rota customizada de servicos (com validação de foreign keys)
router.use('/servicos', servicosRoutes);

// Rota customizada de servico_montadores
const servicoMontadoresRoutes = require('./servico_montadores');
router.use('/servico_montadores', servicoMontadoresRoutes);

// Rota customizada de servico_produtos
const servicoProdutosRoutes = require('./servico_produtos');
router.use('/servico_produtos', servicoProdutosRoutes);

// Rota de anexos de serviços
router.use('/anexos', anexosRoutes);

const routeMap = {
  usuarios: models.Usuario,
  equipes: models.Equipe,
  equipe_membros: models.EquipeMembro,
  // lojas: models.Loja, // Removido - usa rota customizada acima
  clientes_particulares: models.ClienteParticular,
  produtos: models.Produto,
  // servicos: models.Servico, // Removido - usa rota customizada acima
  servico_produtos: models.ServicoProduto,
  servico_montadores: models.ServicoMontador,
  servico_extras: models.ServicoExtra,
  rotas: models.Rota,
  rota_servicos: models.RotaServico,
  recebimentos: models.Recebimento,
  pagamentos_funcionarios: models.PagamentoFuncionario,
  despesas: models.Despesa,
  configuracoes: models.Configuracao
};

const validateUniqueRotaServico = async (req, res) => {
  const { rota_id, servico_id } = req.body || {};

  if (!rota_id || !servico_id) {
    return true;
  }

  const existing = await models.RotaServico.findOne({
    where: { rota_id, servico_id }
  });

  if (existing) {
    res.status(409).json({
      error: 'Registro duplicado',
      details: [
        {
          field: 'rota_id, servico_id',
          message: 'Este serviço já está vinculado a esta rota'
        }
      ]
    });
    return false;
  }

  return true;
};

const normalizeRotaStatusValue = (status) => {
  const statusMap = {
    concluida: 'finalizada',
    concluido: 'finalizada'
  };

  return statusMap[status] || status;
};

const normalizeRotaPayload = async (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return true;
  }

  if (req.body.status) {
    req.body.status = normalizeRotaStatusValue(req.body.status);

    if (!['planejada', 'em_andamento', 'finalizada'].includes(req.body.status)) {
      res.status(400).json({ error: 'Status de rota inválido' });
      return false;
    }
  }

  return true;
};

Object.entries(routeMap).forEach(([path, model]) => {
  const resourceMiddleware = authorizeResource(path);

  if (path === 'pagamentos_funcionarios') {
    router.use(
      `/${path}`,
      resourceMiddleware,
      createPagamentosFuncionariosRouter({
        beforeGetAll: filterPagamentosForMontador,
        afterGetAll: sanitizePagamentosResponse,
        beforeGetById: validatePagamentoOwnership,
        afterGetById: sanitizePagamentoById
      })
    );
    return;
  }

  if (path === 'rota_servicos') {
    router.use(
      `/${path}`,
      resourceMiddleware,
      createCrudRouter(model, {
        beforeCreate: validateUniqueRotaServico
      })
    );
    return;
  }

  if (path === 'rotas') {
    router.use(
      `/${path}`,
      resourceMiddleware,
      createCrudRouter(model, {
        beforeCreate: normalizeRotaPayload,
        beforeUpdate: normalizeRotaPayload
      })
    );
    return;
  }

  router.use(`/${path}`, resourceMiddleware, createCrudRouter(model));
});

module.exports = router;
