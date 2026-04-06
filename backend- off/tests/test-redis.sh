#!/bin/bash

# Script de teste para Redis
# Requer redis-cli instalado

echo "==============================================="
echo "Teste de Conexão Redis"
echo "==============================================="
echo ""

# 1. Verificar se Redis está disponível
echo "1️⃣  Verificando disponibilidade de Redis..."
redis-cli ping 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ Redis está disponível"
  echo ""
  
  # 2. Obter informações do servidor
  echo "2️⃣  Informações do servidor Redis:"
  redis-cli info server | grep -E "redis_version|uptime_in_seconds"
  echo ""
  
  # 3. Listar chaves cacheadas
  echo "3️⃣  Chaves no cache:"
  redis-cli keys '*' | head -20
  echo ""
  
  # 4. Usar memória
  echo "4️⃣  Uso de memória:"
  redis-cli info memory | grep -E "used_memory_human|used_memory_peak_human"
  echo ""
  
  # 5. Conectar à API e testar
  echo "5️⃣  Teste manual:"
  echo "  Comando: redis-cli"
  echo "  SET test:key '\"hello\"'"
  echo "  GET test:key"
  echo "  KEYS '*'"
  echo ""
else
  echo "❌ Redis não está disponível"
  echo ""
  echo "Para iniciar Redis:"
  echo "  - Linux: redis-server"
  echo "  - Docker: docker run -d -p 6379:6379 redis:latest"
fi

echo "==============================================="
