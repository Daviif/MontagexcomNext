### 🔌 WebSocket com Socket.io

Comunicação em tempo real usando Socket.io para sincronizar dados entre servidor e clientes (Desktop, Mobile, Web).

#### Configuração

**Arquivo**: `src/config/websocket.js`

O Socket.io está integrado ao servidor HTTP e requer autenticação via JWT token.

#### Conexão do Cliente

**JavaScript/Node:**
```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: {
    token: 'seu_jwt_token_aqui'
  }
});

socket.on('connect:success', (data) => {
  console.log('Conectado!', data);
});

socket.on('error', (error) => {
  console.error('Erro de conexão:', error);
});
```

**React Native / React:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: jwtToken
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});
```

#### Eventos Disponíveis

##### Sala de Serviços

Entrar em uma sala para receber atualizações de um serviço específico:

```javascript
// Entrar na sala
socket.emit('servico:entrar-sala', servicoId);

// Receber atualizações
socket.on('servico:atualizado', (data) => {
  console.log('Serviço atualizado:', data);
});

// Sair da sala
socket.emit('servico:sair-sala', servicoId);
```

**Dados recebidos:**
```json
{
  "servicoId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "em_rota",
  "timestamp": "2026-02-13T10:30:45.000Z"
}
```

---

##### Sala de Rotas

Monitorar rotas em tempo real (localização, status, etc):

```javascript
// Entrar na sala
socket.emit('rota:entrar-sala', rotaId);

// Receber atualizações
socket.on('rota:atualizada', (data) => {
  console.log('Rota atualizada:', data);
});

// Receber atualizações de localização
socket.on('rota:localizacao-atualizada', (data) => {
  console.log('Nova localização:', data);
});

// Sair da sala
socket.emit('rota:sair-sala', rotaId);
```

**Dados recebidos:**
```json
{
  "rotaId": "550e8400-e29b-41d4-a716-446655440000",
  "latitude": -23.550520,
  "longitude": -46.633309,
  "timestamp": "2026-02-13T10:30:45.000Z"
}
```

---

##### Sala de Equipes

Obter notificações de mudanças na equipe:

```javascript
socket.emit('equipe:entrar-sala', equipeId);

socket.on('equipe:atualizada', (data) => {
  console.log('Equipe atualizada:', data);
});

socket.emit('equipe:sair-sala', equipeId);
```

---

##### Notificações Globais

```javascript
socket.on('notificacao', (notification) => {
  console.log(notification);
  // {
  //   "titulo": "Novo serviço",
  //   "mensagem": "Um novo serviço foi atribuído à sua equipe",
  //   "tipo": "info",
  //   "timestamp": "2026-02-13T10:30:45.000Z"
  // }
});
```

---

##### Health Check

Verificar conexão:

```javascript
socket.emit('ping', (response) => {
  console.log('Resposta:', response);
  // { pong: true, timestamp: "2026-02-13T10:30:45.000Z" }
});
```

#### Emitindo Eventos do Servidor

**Exemplo com Express:**

```javascript
const { emitirServicoAtualizado } = require('./utils/websocket');

// Em uma rota
app.put('/api/servicos/:id', async (req, res) => {
  const servico = await Servico.update(req.body, { where: { id: req.params.id } });
  
  const io = req.app.get('io');
  emitirServicoAtualizado(io, req.params.id, {
    status: req.body.status
  });

  res.json(servico);
});
```

#### Funções Utilitárias

**Arquivo**: `src/utils/websocket.js`

```javascript
// Emitir para uma sala específica
emitirServicoAtualizado(io, servicoId, dados);
emitirRotaAtualizada(io, rotaId, dados);
emitirEquipeAtualizada(io, equipeId, dados);

// Emitir notificação para usuários específicos
emitirNotificacao(io, [usuarioId1, usuarioId2], titulo, mensagem, tipo);

// Transmitir localização
transmitirLocalizacaoRota(io, rotaId, latitude, longitude);
```

#### Casos de Uso

1. **Dashboard em Tempo Real** - Atualizar métricas automaticamente
2. **Rastreamento de Rota** - Mostrar localização de equipes no mapa
3. **Notificações Instantâneas** - Alertar sobre novos serviços
4. **Sincronização de Estado** - Manter dados sincronizados entre dispositivos
5. **Chat/Mensagens** - Comunicação entre montadores (futuro)

#### Variáveis de Ambiente

```env
# Opcional - CORS
CORS_ORIGIN=*
```

#### Debugging

**No servidor:**
```javascript
io.on('connection', (socket) => {
  console.log('Socket conectado:', socket.id);
  console.log('Usuário:', socket.user);
});
```

**No cliente:**
```javascript
socket.onAny((eventName, ...args) => {
  console.log(`[Socket] ${eventName}`, args);
});
```
