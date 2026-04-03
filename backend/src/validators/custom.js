// Validadores customizados reutilizáveis

const { body, validationResult } = require('express-validator');

// Validador de senha forte
const senhaForte = body('senha')
  .isLength({ min: 8 }).withMessage('Senha deve ter pelo menos 8 caracteres')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais');

// Validador de CPF
const validarCPF = (cpf) => {
  cpf = cpf.replace(/\D/g, '');

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    throw new Error('CPF inválido');
  }

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) throw new Error('CPF inválido');

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) throw new Error('CPF inválido');

  return true;
};

const cpfValidator = body('cpf')
  .optional()
  .trim()
  .custom(validarCPF);

// Validador de hora
const horaValidator = body('hora')
  .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
  .withMessage('Hora deve estar em formato HH:MM');

// Validador de data no futuro
const dataFuturaValidator = body('data')
  .custom((value) => {
    const data = new Date(value);
    if (data <= new Date()) {
      throw new Error('Data deve ser no futuro');
    }
    return true;
  });

// Validador de data no passado
const dataPassadaValidator = body('data')
  .custom((value) => {
    const data = new Date(value);
    if (data >= new Date()) {
      throw new Error('Data deve ser no passado');
    }
    return true;
  });

// Validador de intervalo de datas
const intervaloDataValidator = (campoInicio, campoFim) => [
  body(campoInicio)
    .isISO8601().withMessage('Data deve estar em formato ISO8601'),
  body(campoFim)
    .isISO8601().withMessage('Data deve estar em formato ISO8601')
    .custom((value, { req }) => {
      const inicio = new Date(req.body[campoInicio]);
      const fim = new Date(value);
      if (fim <= inicio) {
        throw new Error(`${campoFim} deve ser após ${campoInicio}`);
      }
      return true;
    })
];

// Validador de array não vazio
const arrayNaoVazioValidator = body('items')
  .isArray({ min: 1 }).withMessage('Items deve ser um array não vazio');

module.exports = {
  senhaForte,
  cpfValidator,
  horaValidator,
  dataFuturaValidator,
  dataPassadaValidator,
  intervaloDataValidator,
  arrayNaoVazioValidator
};
