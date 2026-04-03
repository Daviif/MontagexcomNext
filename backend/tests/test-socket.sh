#!/bin/bash

# Script de teste para conexão WebSocket
# Requer Node.js com socket.io-client

cat > /tmp/test-socket.js << 'EOF'
const io = require('socket.io-client');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Pedir token
rl.question('Cole seu JWT token: ', (token) => {
  const socket = io('http://localhost:3000', {
    auth: {
      token: token
    }
  });

  socket.on('connect', () => {
    console.log('\n✅ Conectado ao servidor WebSocket!');
    console.log('Socket ID:', socket.id);
  });

  socket.on('connect:success', (data) => {
    console.log('\n📱 Sucesso na autenticação:', data);
  });

  socket.on('disconnect', () => {
    console.log('\n❌ Desconectado do servidor');
  });

  socket.on('error', (error) => {
    console.error('\n⚠️  Erro:', error);
  });

  socket.on('servico:atualizado', (data) => {
    console.log('\n📊 Serviço atualizado:', data);
  });

  socket.on('rota:atualizada', (data) => {
    console.log('\n🗺️  Rota atualizada:', data);
  });

  socket.on('notificacao', (data) => {
    console.log('\n🔔 Notificação:', data);
  });

  console.log('\nKomandos disponíveis:');
  console.log('  ping              - Verificar conexão');
  console.log('  join-service ID   - Entrar em sala de serviço');
  console.log('  join-route ID     - Entrar em sala de rota');
  console.log('  leave-service ID  - Sair de sala de serviço');
  console.log('  quit              - Sair\n');

  rl.on('line', (input) => {
    const [cmd, ...args] = input.trim().split(' ');

    if (cmd === 'ping') {
      socket.emit('ping', (response) => {
        console.log('Pong:', response);
      });
    } else if (cmd === 'join-service') {
      socket.emit('servico:entrar-sala', args[0]);
      console.log(`Entrou na sala servico:${args[0]}`);
    } else if (cmd === 'join-route') {
      socket.emit('rota:entrar-sala', args[0]);
      console.log(`Entrou na sala rota:${args[0]}`);
    } else if (cmd === 'leave-service') {
      socket.emit('servico:sair-sala', args[0]);
      console.log(`Saiu da sala servico:${args[0]}`);
    } else if (cmd === 'quit') {
      socket.disconnect();
      rl.close();
    } else {
      console.log('Comando não reconhecido');
    }
  });
});
EOF

node /tmp/test-socket.js
