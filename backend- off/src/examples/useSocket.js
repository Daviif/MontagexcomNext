// Exemplo de hook React para usar Socket.io

import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

export function useSocket(url, token) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io(url, {
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current.on('connect', () => {
      setConnected(true);
      setError(null);
      console.log('Socket conectado');
    });

    socketRef.current.on('connect:success', (data) => {
      console.log('Autenticação bem-sucedida:', data);
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
      console.log('Socket desconectado');
    });

    socketRef.current.on('error', (err) => {
      setError(err);
      console.error('Erro no socket:', err);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [url, token]);

  const emit = useCallback((event, data, callback) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data, callback);
    }
  }, []);

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  return {
    socket: socketRef.current,
    connected,
    error,
    emit,
    on,
    off
  };
}

// Exemplo de uso:
/*
import { useSocket } from './hooks/useSocket';

function Dashboard({ token }) {
  const { connected, emit, on } = useSocket('http://localhost:3000', token);

  useEffect(() => {
    on('servico:atualizado', (data) => {
      console.log('Serviço atualizado:', data);
    });

    return () => {
      off('servico:atualizado');
    };
  }, []);

  const entrarEmServico = (servicoId) => {
    emit('servico:entrar-sala', servicoId);
  };

  return (
    <div>
      <p>Status: {connected ? '✅ Conectado' : '❌ Desconectado'}</p>
      <button onClick={() => entrarEmServico('123')}>
        Entrar em Serviço
      </button>
    </div>
  );
}
*/
