const { body, param, query, validationResult } = require('express-validator');

// Middleware para capturar erros de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validação falhou',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// ========== USUARIO ==========

const usuarioValidators = {
  create: [
    body('nome')
      .trim()
      .notEmpty().withMessage('Nome é obrigatório')
      .isLength({ min: 3, max: 120 }).withMessage('Nome deve ter entre 3 e 120 caracteres'),
    
    body('email')
      .trim()
      .isEmail().withMessage('Email inválido')
      .normalizeEmail(),
    
    body('senha')
      .isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    
    body('tipo')
      .optional()
      .isIn(['admin', 'montador']).withMessage('Tipo deve ser admin ou montador'),

    handleValidationErrors
  ],

  update: [
    body('nome')
      .optional()
      .trim()
      .isLength({ min: 3, max: 120 }).withMessage('Nome deve ter entre 3 e 120 caracteres'),
    
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Email inválido')
      .normalizeEmail(),
    
    body('tipo')
      .optional()
      .isIn(['admin', 'montador']).withMessage('Tipo deve ser admin ou montador'),

    handleValidationErrors
  ]
};

// ========== EQUIPE ==========

const equipeValidators = {
  create: [
    body('nome')
      .trim()
      .notEmpty().withMessage('Nome é obrigatório')
      .isLength({ min: 3, max: 100 }).withMessage('Nome deve ter entre 3 e 100 caracteres'),

    handleValidationErrors
  ],

  update: [
    body('nome')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 }).withMessage('Nome deve ter entre 3 e 100 caracteres'),

    body('ativa')
      .optional()
      .isBoolean().withMessage('Ativa deve ser um booleano'),

    handleValidationErrors
  ]
};

// ========== LOJA ==========

const lojaValidators = {
  create: [
    body('nome')
      .trim()
      .notEmpty().withMessage('Nome é obrigatório')
      .isLength({ min: 3, max: 150 }).withMessage('Nome deve ter entre 3 e 150 caracteres'),

    body('telefone')
      .optional()
      .matches(/^[\d\s\-\(\)]+$/).withMessage('Telefone inválido'),

    body('email')
      .optional()
      .isEmail().withMessage('Email inválido')
      .normalizeEmail(),

    body('prazo_pagamento_dias')
      .optional()
      .isInt({ min: 0, max: 365 }).withMessage('Prazo deve estar entre 0 e 365 dias'),

    handleValidationErrors
  ],

  update: [
    body('nome')
      .optional()
      .trim()
      .isLength({ min: 3, max: 150 }).withMessage('Nome deve ter entre 3 e 150 caracteres'),

    body('telefone')
      .optional()
      .matches(/^[\d\s\-\(\)]+$/).withMessage('Telefone inválido'),

    body('email')
      .optional()
      .isEmail().withMessage('Email inválido')
      .normalizeEmail(),

    body('prazo_pagamento_dias')
      .optional()
      .isInt({ min: 0, max: 365 }).withMessage('Prazo deve estar entre 0 e 365 dias'),

    handleValidationErrors
  ]
};

// ========== CLIENTE PARTICULAR ==========

const clienteParticularValidators = {
  create: [
    body('nome')
      .trim()
      .notEmpty().withMessage('Nome é obrigatório')
      .isLength({ min: 3, max: 150 }).withMessage('Nome deve ter entre 3 e 150 caracteres'),

    body('telefone')
      .optional()
      .matches(/^[\d\s\-\(\)]+$/).withMessage('Telefone inválido'),

    handleValidationErrors
  ],

  update: [
    body('nome')
      .optional()
      .trim()
      .isLength({ min: 3, max: 150 }).withMessage('Nome deve ter entre 3 e 150 caracteres'),

    body('telefone')
      .optional()
      .matches(/^[\d\s\-\(\)]+$/).withMessage('Telefone inválido'),

    handleValidationErrors
  ]
};

// ========== PRODUTO ==========

const produtoValidators = {
  create: [
    body('nome')
      .trim()
      .notEmpty().withMessage('Nome é obrigatório')
      .isLength({ min: 3, max: 150 }).withMessage('Nome deve ter entre 3 e 150 caracteres'),

    body('valor_base')
      .optional()
      .isDecimal({ decimal_digits: '1,2' }).withMessage('Valor deve ser decimal com até 2 casas'),

    body('tempo_base_min')
      .notEmpty().withMessage('Tempo base é obrigatório')
      .isInt({ min: 1 }).withMessage('Tempo base deve ser um inteiro positivo'),

    handleValidationErrors
  ],

  update: [
    body('nome')
      .optional()
      .trim()
      .isLength({ min: 3, max: 150 }).withMessage('Nome deve ter entre 3 e 150 caracteres'),

    body('valor_base')
      .optional()
      .isDecimal({ decimal_digits: '1,2' }).withMessage('Valor deve ser decimal com até 2 casas'),

    body('tempo_base_min')
      .optional()
      .isInt({ min: 1 }).withMessage('Tempo base deve ser um inteiro positivo'),

    body('ativo')
      .optional()
      .isBoolean().withMessage('Ativo deve ser um booleano'),

    handleValidationErrors
  ]
};

// ========== SERVICO ==========

const servicoValidators = {
  create: [
    body('data_servico')
      .notEmpty().withMessage('Data do serviço é obrigatória')
      .isISO8601().withMessage('Data deve estar em formato ISO8601'),

    body('tipo_cliente')
      .notEmpty().withMessage('Tipo de cliente é obrigatório')
      .isIn(['loja', 'particular']).withMessage('Tipo deve ser loja ou particular'),

    body('endereco_execucao')
      .trim()
      .notEmpty().withMessage('Endereço é obrigatório'),

    body('loja_id')
      .if((value, { req }) => req.body.tipo_cliente === 'loja')
      .notEmpty().withMessage('Loja ID é obrigatório para clientes loja')
      .isUUID().withMessage('Loja ID deve ser um UUID válido'),

    body('cliente_particular_id')
      .if((value, { req }) => req.body.tipo_cliente === 'particular')
      .notEmpty().withMessage('Cliente ID é obrigatório para clientes particulares')
      .isUUID().withMessage('Cliente ID deve ser um UUID válido'),

    body('latitude')
      .optional()
      .isFloat({ min: -90, max: 90 }).withMessage('Latitude deve estar entre -90 e 90'),

    body('longitude')
      .optional()
      .isFloat({ min: -180, max: 180 }).withMessage('Longitude deve estar entre -180 e 180'),

    body('prioridade')
      .optional()
      .isInt({ min: 0, max: 10 }).withMessage('Prioridade deve estar entre 0 e 10'),

    body('valor_total')
      .optional()
      .isDecimal({ decimal_digits: '1,2' }).withMessage('Valor deve ser decimal com até 2 casas'),

    body('status')
      .optional()
      .isIn(['agendado', 'em_rota', 'concluido', 'cancelado']).withMessage('Status inválido'),

    body('cliente_final_nome')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Nome do cliente final muito longo'),

    body('cliente_final_contato')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Contato do cliente final muito longo'),

    body('codigo_os_loja')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Código OS da loja muito longo'),

    handleValidationErrors
  ],

  update: [
    body('data_servico')
      .optional()
      .isISO8601().withMessage('Data deve estar em formato ISO8601'),

    body('status')
      .optional()
      .isIn(['agendado', 'em_rota', 'concluido', 'cancelado']).withMessage('Status inválido'),

    body('valor_total')
      .optional()
      .isDecimal({ decimal_digits: '1,2' }).withMessage('Valor deve ser decimal com até 2 casas'),

    body('cliente_final_nome')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Nome do cliente final muito longo'),

    body('cliente_final_contato')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Contato do cliente final muito longo'),

    body('codigo_os_loja')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Código OS da loja muito longo'),

    handleValidationErrors
  ]
};

// ========== ROTA ==========

const rotaValidators = {
  create: [
    body('data')
      .notEmpty().withMessage('Data é obrigatória')
      .isISO8601().withMessage('Data deve estar em formato ISO8601'),

    body('equipe_id')
      .notEmpty().withMessage('ID da equipe é obrigatório')
      .isUUID().withMessage('Equipe ID deve ser um UUID válido'),

    body('horario_inicio')
      .notEmpty().withMessage('Horário de início é obrigatório')
      .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato deve ser HH:MM'),

    body('horario_fim')
      .notEmpty().withMessage('Horário de fim é obrigatório')
      .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato deve ser HH:MM'),

    handleValidationErrors
  ],

  update: [
    body('status')
      .optional()
      .isIn(['planejada', 'em_andamento', 'finalizada', 'concluida', 'concluido']).withMessage('Status inválido'),

    body('km_total')
      .optional()
      .isDecimal().withMessage('KM deve ser um número decimal'),

    body('tempo_total_min')
      .optional()
      .isInt({ min: 0 }).withMessage('Tempo deve ser um inteiro não negativo'),

    handleValidationErrors
  ]
};

// ========== RECEBIMENTO ==========

const recebimentoValidators = {
  create: [
    body('servico_id')
      .notEmpty().withMessage('Serviço ID é obrigatório')
      .isUUID().withMessage('Serviço ID deve ser um UUID válido'),

    body('valor')
      .notEmpty().withMessage('Valor é obrigatório')
      .isDecimal({ decimal_digits: '1,2' }).withMessage('Valor deve ser decimal com até 2 casas'),

    body('data_prevista')
      .optional()
      .isISO8601().withMessage('Data deve estar em formato ISO8601'),

    body('status')
      .optional()
      .isIn(['pendente', 'recebido']).withMessage('Status deve ser pendente ou recebido'),

    handleValidationErrors
  ],

  update: [
    body('status')
      .optional()
      .isIn(['pendente', 'recebido']).withMessage('Status deve ser pendente ou recebido'),

    body('data_recebimento')
      .optional()
      .isISO8601().withMessage('Data deve estar em formato ISO8601'),

    body('valor')
      .optional()
      .isDecimal({ decimal_digits: '1,2' }).withMessage('Valor deve ser decimal com até 2 casas'),

    handleValidationErrors
  ]
};

// ========== QUERY PARAMS ==========

const paginationValidator = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 }).withMessage('Limit deve estar entre 1 e 200'),

  query('offset')
    .optional()
    .isInt({ min: 0 }).withMessage('Offset deve ser um inteiro não negativo'),

  query('orderBy')
    .optional()
    .isString().withMessage('OrderBy deve ser uma string'),

  query('orderDir')
    .optional()
    .isIn(['ASC', 'DESC']).withMessage('Direção deve ser ASC ou DESC'),

  handleValidationErrors
];

// ========== PARAM ID ==========

const uuidParamValidator = [
  param('id')
    .isUUID().withMessage('ID deve ser um UUID válido'),

  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  usuarioValidators,
  equipeValidators,
  lojaValidators,
  clienteParticularValidators,
  produtoValidators,
  servicoValidators,
  rotaValidators,
  recebimentoValidators,
  paginationValidator,
  uuidParamValidator
};
