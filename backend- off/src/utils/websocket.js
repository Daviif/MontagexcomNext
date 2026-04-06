// Helper para emitir eventos Socket.io após operações CRUD
function emitirServicoAtualizado(io, servicoId, dados) {
  io.to(`servico:${servicoId}`).emit('servico:atualizado', {
    servicoId,
    timestamp: new Date().toISOString(),
    ...dados
  });
}

function emitirRotaAtualizada(io, rotaId, dados) {
  io.to(`rota:${rotaId}`).emit('rota:atualizada', {
    rotaId,
    timestamp: new Date().toISOString(),
    ...dados
  });
}

function emitirEquipeAtualizada(io, equipeId, dados) {
  io.to(`equipe:${equipeId}`).emit('equipe:atualizada', {
    equipeId,
    timestamp: new Date().toISOString(),
    ...dados
  });
}

function emitirNotificacao(io, usuarios, titulo, mensagem, tipo = 'info') {
  const notification = {
    titulo,
    mensagem,
    tipo,
    timestamp: new Date().toISOString()
  };

  if (Array.isArray(usuarios)) {
    usuarios.forEach(usuarioId => {
      io.to(usuarioId).emit('notificacao', notification);
    });
  } else {
    io.emit('notificacao', notification);
  }
}

function transmitirLocalizacaoRota(io, rotaId, latitude, longitude, timestamp) {
  io.to(`rota:${rotaId}`).emit('rota:localizacao-atualizada', {
    rotaId,
    latitude,
    longitude,
    timestamp: timestamp || new Date().toISOString()
  });
}

module.exports = {
  emitirServicoAtualizado,
  emitirRotaAtualizada,
  emitirEquipeAtualizada,
  emitirNotificacao,
  transmitirLocalizacaoRota
};
