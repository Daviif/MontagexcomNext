const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

const apiRoutes = require('./routes');
const authRoutes = require('./routes/auth');

const app = express();

app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://localhost:4173'];

const isAllowedNetlifyPreviewOrigin = (origin) => {
  if (!origin) {
    return false;
  }

  return /^https:\/\/[a-z0-9-]+--montagex\.netlify\.app$/i.test(origin);
};

app.use(cors({
  origin: (origin, callback) => {
    const normalizedOrigin = origin ? origin.replace(/\/$/, '') : origin;
    if (
      !normalizedOrigin ||
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(normalizedOrigin) ||
      isAllowedNetlifyPreviewOrigin(normalizedOrigin)
    ) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqueado para origem: ${normalizedOrigin}`));
    }
  },
  credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Servir uploads estaticamente
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Compatibilidade: permite login em clientes apontando para /auth sem /api
app.use('/auth', authRoutes);

app.use('/api', apiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Registro duplicado',
      details: (err.errors || []).map(e => ({
        field: e.path,
        message: e.message || 'Valor já existe'
      }))
    });
  }

  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
