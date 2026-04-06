#!/bin/bash

# Script de inicialização rápida do backend
# Instala, configura e inicia o servidor

set -e

echo "================================"
echo "🚀 Setup Rápido - Backend"
echo "================================"
echo ""

# 1. Verificar Node.js
echo "1️⃣  Verificando Node.js..."
if ! command -v node &> /dev/null; then
  echo "❌ Node.js não instalado"
  exit 1
fi
echo "✅ Node.js $(node -v)"
echo ""

# 2. Instalar dependências
echo "2️⃣  Instalando dependências..."
npm install
echo "✅ Dependências instaladas"
echo ""

# 3. Copiar .env.example para .env
if [ ! -f .env ]; then
  echo "3️⃣  Criando arquivo .env..."
  cp .env.example .env
  echo "⚠️  Edite o arquivo .env com suas credenciais"
else
  echo "3️⃣  Arquivo .env já existe"
fi
echo ""

# 4. Gerar JWT_SECRET
if ! grep -q "JWT_SECRET=sua_chave" .env; then
  echo "4️⃣  JWT_SECRET já configurado"
else
  echo "4️⃣  Gerando JWT_SECRET..."
  SECRET=$(openssl rand -hex 32)
  sed -i.bak "s/JWT_SECRET=sua_chave_secreta_super_segura_aqui/JWT_SECRET=$SECRET/" .env
  echo "✅ JWT_SECRET gerado"
fi
echo ""

# 5. Verificar serviços
echo "5️⃣  Verificando serviços..."

# PostgreSQL
if nc -z localhost 5432 2>/dev/null; then
  echo "✅ PostgreSQL rodando (5432)"
else
  echo "⚠️  PostgreSQL não encontrado em localhost:5432"
  echo "   Inicie com: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15"
fi

# Redis
if nc -z localhost 6379 2>/dev/null; then
  echo "✅ Redis rodando (6379)"
else
  echo "⚠️  Redis não encontrado em localhost:6379"
  echo "   Inicie com: docker run -d -p 6379:6379 redis:latest"
fi
echo ""

# 6. Opção para iniciar servidor
echo "6️⃣  Iniciar servidor?"
echo "   Opções:"
echo "   1) npm run dev    (com nodemon)"
echo "   2) npm start      (production)"
echo "   0) Pular"
echo ""
read -p "Escolha (0-2): " choice

case $choice in
  1)
    npm run dev
    ;;
  2)
    npm start
    ;;
  0)
    echo "✅ Setup concluído!"
    echo ""
    echo "Para iniciar o servidor depois:"
    echo "  npm run dev"
    ;;
  *)
    echo "Opção inválida"
    ;;
esac
