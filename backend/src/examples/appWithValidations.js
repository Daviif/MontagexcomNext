// Exemplo de integração global de validações

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const apiRoutes = require('./routes');

const app = express();

// Segurança
app.use(helmet());
app.use(cors());

// Middleware padrão
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Rotas protegidas com autenticação e validação
app.use('/api', apiRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  
  // Erro de validação
  if (err.array && typeof err.array === 'function') {
    return res.status(400).json({
      error: 'Validação falhou',
      details: err.array()
    });
  }

  // Erro de banco de dados (Sequelize)
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validação do banco falhou',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Registro duplicado',
      details: err.errors.map(e => ({
        field: e.path,
        message: 'Valor já existe'
      }))
    });
  }

  // Erro genérico
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
