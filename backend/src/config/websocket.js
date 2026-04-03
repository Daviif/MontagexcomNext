const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

function setupWebSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    }
  });

  // Middleware de autenticação para Socket.io
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Token ausente'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Cliente conectado: ${socket.id}`);

    // User conectou
    socket.emit('connect:success', {
      message: 'Conectado ao servidor',
      userId: socket.user.id,
      userType: socket.user.tipo
    });

    // ========== EVENTOS DE SERVICO ==========
    
    socket.on('servico:entrar-sala', (servicoId) => {
      socket.join(`servico:${servicoId}`);
      console.log(`[Socket.io] Usuário ${socket.user.id} entrou na sala servico:${servicoId}`);
    });

    socket.on('servico:sair-sala', (servicoId) => {
      socket.leave(`servico:${servicoId}`);
      console.log(`[Socket.io] Usuário ${socket.user.id} saiu da sala servico:${servicoId}`);
    });

    // ========== EVENTOS DE ROTA ==========

    socket.on('rota:entrar-sala', (rotaId) => {
      socket.join(`rota:${rotaId}`);
      console.log(`[Socket.io] Usuário ${socket.user.id} entrou na sala rota:${rotaId}`);
    });

    socket.on('rota:sair-sala', (rotaId) => {
      socket.leave(`rota:${rotaId}`);
      console.log(`[Socket.io] Usuário ${socket.user.id} saiu da sala rota:${rotaId}`);
    });

    // ========== EVENTOS DE EQUIPE ==========

    socket.on('equipe:entrar-sala', (equipeId) => {
      socket.join(`equipe:${equipeId}`);
      console.log(`[Socket.io] Usuário ${socket.user.id} entrou na sala equipe:${equipeId}`);
    });

    socket.on('equipe:sair-sala', (equipeId) => {
      socket.leave(`equipe:${equipeId}`);
      console.log(`[Socket.io] Usuário ${socket.user.id} saiu da sala equipe:${equipeId}`);
    });

    // ========== EVENTOS DE PING ==========

    socket.on('ping', (callback) => {
      callback({ pong: true, timestamp: new Date().toISOString() });
    });

    // ========== DESCONEXÃO ==========

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Cliente desconectado: ${socket.id}`);
    });

    socket.on('error', (error) => {
      console.error(`[Socket.io] Erro no socket ${socket.id}:`, error);
    });
  });

  return io;
}

module.exports = setupWebSocket;
