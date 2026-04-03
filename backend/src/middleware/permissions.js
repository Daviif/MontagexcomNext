const { models } = require('../models');
const { Op } = require('sequelize');

const isAdmin = (req) => req.user?.tipo === 'admin';
const isMontador = (req) => req.user?.tipo === 'montador';

const deny = (res, message = 'Acesso negado') => {
  return res.status(403).json({ error: message });
};

const requireAdmin = (message = 'Apenas administradores podem realizar esta ação') => {
  return (req, res, next) => {
    if (!isAdmin(req)) {
      return deny(res, message);
    }

    next();
  };
};

const authorizeResource = (resourceName) => {
  return (req, res, next) => {
    if (isAdmin(req)) {
      return next();
    }

    if (!isMontador(req)) {
      return deny(res);
    }

    const method = req.method.toUpperCase();

    // Leitura liberada por padrão para montador
    if (method === 'GET') {
      return next();
    }

    // Produtos: montador pode cadastrar, mas não editar/excluir
    if (resourceName === 'produtos') {
      if (method === 'POST') {
        return next();
      }
      return deny(res, 'Montador só pode cadastrar produtos');
    }

    // Clientes: somente visualização
    if (resourceName === 'clientes_particulares' || resourceName === 'lojas') {
      return deny(res, 'Montador não pode cadastrar ou alterar clientes');
    }

    // Gestão de equipe e montadores: somente admins
    if (
      resourceName === 'usuarios'
      || resourceName === 'equipes'
      || resourceName === 'equipe_membros'
    ) {
      return deny(res, 'Apenas administradores podem gerenciar montadores e equipes');
    }

    // Rotas: montador apenas visualiza
    if (resourceName === 'rotas' || resourceName === 'rota_servicos') {
      return deny(res, 'Montador não pode alterar rotas');
    }

    // Financeiro: montador não cria/edita/exclui registros
    if (
      resourceName === 'recebimentos'
      || resourceName === 'despesas'
      || resourceName === 'pagamentos_funcionarios'
    ) {
      return deny(res, 'Montador não pode alterar registros financeiros');
    }

    return deny(res);
  };
};

const authorizeServicoWrite = async (req, res, next) => {
  if (isAdmin(req)) {
    return next();
  }

  if (!isMontador(req)) {
    return deny(res);
  }

  if (req.method === 'GET') {
    return next();
  }

  if (req.method !== 'PUT') {
    return deny(res, 'Montador só pode atualizar status e observações do serviço');
  }

  const allowedFields = ['status', 'observacoes'];
  const payloadKeys = Object.keys(req.body || {});
  const hasInvalidField = payloadKeys.some((key) => !allowedFields.includes(key));

  if (hasInvalidField) {
    return deny(res, 'Montador só pode atualizar status e observações do serviço');
  }

  if (req.body?.status && !['concluido', 'cancelado'].includes(req.body.status)) {
    return deny(res, 'Montador só pode marcar serviço como concluído ou cancelado');
  }

  if (req.params?.id) {
    const servicoId = req.params.id;
    const usuarioId = req.user.id;

    const atribuicaoDireta = await models.ServicoMontador.findOne({
      where: {
        servico_id: servicoId,
        usuario_id: usuarioId
      }
    });

    if (atribuicaoDireta) {
      return next();
    }

    const membros = await models.EquipeMembro.findAll({
      where: {
        usuario_id: usuarioId
      },
      attributes: ['equipe_id']
    });

    const equipeIds = membros.map((m) => m.equipe_id).filter(Boolean);

    if (equipeIds.length === 0) {
      return deny(res, 'Serviço não está atribuído a você');
    }

    const atribuicaoEquipe = await models.ServicoMontador.findOne({
      where: {
        servico_id: servicoId,
        equipe_id: {
          [Op.in]: equipeIds
        }
      }
    });

    if (!atribuicaoEquipe) {
      return deny(res, 'Serviço não está atribuído a você');
    }
  }

  next();
};

const filterPagamentosForMontador = (req, res) => {
  if (isMontador(req)) {
    req.query.usuario_id = req.user.id;
  }
};

const sanitizePagamentosResponse = (req, pagamentos) => {
  if (!isMontador(req)) {
    return pagamentos;
  }

  return pagamentos.map((pagamento) => {
    const plain = typeof pagamento.toJSON === 'function' ? pagamento.toJSON() : { ...pagamento };

    if (plain.status !== 'pago') {
      return {
        ...plain,
        valor: null
      };
    }

    return plain;
  });
};

const validatePagamentoOwnership = async (req, res) => {
  if (!isMontador(req)) {
    return true;
  }

  const pagamentoId = req.params?.id;
  if (!pagamentoId) {
    return true;
  }

  const pagamento = await models.PagamentoFuncionario.findByPk(pagamentoId);
  if (!pagamento || pagamento.usuario_id !== req.user.id) {
    res.status(404).json({ error: 'Not found' });
    return false;
  }

  return true;
};

const sanitizePagamentoById = (req, pagamento) => {
  if (!isMontador(req)) {
    return pagamento;
  }

  const plain = typeof pagamento.toJSON === 'function' ? pagamento.toJSON() : { ...pagamento };
  if (plain.status !== 'pago') {
    return {
      ...plain,
      valor: null
    };
  }

  return plain;
};

module.exports = {
  requireAdmin,
  authorizeResource,
  authorizeServicoWrite,
  filterPagamentosForMontador,
  sanitizePagamentosResponse,
  validatePagamentoOwnership,
  sanitizePagamentoById
};
