require('dotenv').config();

const http = require('http');
const app = require('./app');
const setupWebSocket = require('./config/websocket');
const { initRedis } = require('./config/redis');
const { sequelize } = require('./models');
const seedAdmin = require('./database/seed');

const port = Number(process.env.PORT) || 3000;

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('JWT_SECRET é obrigatório em produção.');
    process.exit(1);
  }
  console.warn('JWT_SECRET não definido. Usando valor inseguro para desenvolvimento.');
  process.env.JWT_SECRET = 'dev-secret';
}

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Banco de dados conectado com sucesso');
    await seedAdmin();
  } catch (err) {
    console.error('Falha ao conectar no banco de dados:', err.message);
    process.exit(1);
  }

  // Criar servidor HTTP para suportar WebSocket
  const server = http.createServer(app);

  // Inicializar Redis
  initRedis().catch((err) => {
    console.error('Redis não disponível:', err);
  });

  // Configurar Socket.io
  const io = setupWebSocket(server);

  // Exportar io para uso em outras partes da aplicação
  app.set('io', io);

  server.listen(port, () => {
    console.log(`API running on port ${port}`);
    console.log(`WebSocket disponível em ws://localhost:${port}`);
  });
};

startServer();
