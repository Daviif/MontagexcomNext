// Exemplo de cliente Socket.io em JavaScript vanilla / React Native

class SocketClient {
  constructor(url, token) {
    this.url = url;
    this.token = token;
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    const io = require('socket.io-client');
    
    this.socket = io(this.url, {
      auth: {
        token: this.token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('[SocketClient] Conectado');
      this.emit('_connected');
    });

    this.socket.on('disconnect', () => {
      console.log('[SocketClient] Desconectado');
      this.emit('_disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('[SocketClient] Erro:', error);
      this.emit('_error', error);
    });

    // Reenviar todos os eventos para listeners
    this.socket.onAny((eventName, ...args) => {
      if (this.listeners.has(eventName)) {
        this.listeners.get(eventName).forEach(callback => {
          callback(...args);
        });
      }
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data, callback) {
    if (this.socket) {
      this.socket.emit(event, data, callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // Métodos específicos do domínio
  entrarEmServico(servicoId) {
    this.emit('servico:entrar-sala', servicoId);
  }

  sairDeServico(servicoId) {
    this.emit('servico:sair-sala', servicoId);
  }

  entrarEmRota(rotaId) {
    this.emit('rota:entrar-sala', rotaId);
  }

  sairDeRota(rotaId) {
    this.emit('rota:sair-sala', rotaId);
  }

  entrarEmEquipe(equipeId) {
    this.emit('equipe:entrar-sala', equipeId);
  }

  sairDeEquipe(equipeId) {
    this.emit('equipe:sair-sala', equipeId);
  }

  ping() {
    return new Promise((resolve) => {
      this.emit('ping', null, (response) => {
        resolve(response);
      });
    });
  }

  onServicoAtualizado(callback) {
    this.on('servico:atualizado', callback);
  }

  onRotaAtualizada(callback) {
    this.on('rota:atualizada', callback);
  }

  onLocalizacaoAtualizada(callback) {
    this.on('rota:localizacao-atualizada', callback);
  }

  onNotificacao(callback) {
    this.on('notificacao', callback);
  }

  onConnected(callback) {
    this.on('_connected', callback);
  }

  onDisconnected(callback) {
    this.on('_disconnected', callback);
  }

  onError(callback) {
    this.on('_error', callback);
  }
}

// Exemplo de uso:
/*
const client = new SocketClient('http://localhost:3000', jwtToken);

client.connect();

client.onConnected(() => {
  console.log('Pronto para usar!');
  client.entrarEmServico('123-abc');
});

client.onServicoAtualizado((data) => {
  console.log('Serviço atualizado:', data);
});

client.ping().then(response => {
  console.log('Ping respondido:', response);
});

client.onNotificacao((notification) => {
  console.log('Nova notificação:', notification.titulo);
});
*/

module.exports = SocketClient;
