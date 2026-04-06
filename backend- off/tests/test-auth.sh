#!/bin/bash

# Script de teste rápido para autenticação JWT
# Certifique-se que o servidor está rodando em http://localhost:3000

API="http://localhost:3000/api"
EMAIL="teste@exemplo.com"
SENHA="senha123456"
NOME="Usuário Teste"

echo "==============================================="
echo "Teste de Autenticação JWT"
echo "==============================================="
echo ""

# 1. Teste de Health Check
echo "1️⃣  Teste de Health Check..."
curl -X GET "$API/health"
echo ""
echo ""

# 2. Registro de novo usuário
echo "2️⃣  Registro de novo usuário..."
REGISTER=$(curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"nome\": \"$NOME\",
    \"email\": \"$EMAIL\",
    \"senha\": \"$SENHA\",
    \"tipo\": \"montador\"
  }")

echo "$REGISTER" | jq '.'
TOKEN=$(echo "$REGISTER" | jq -r '.token')
echo "Token obtido: $TOKEN"
echo ""

# 3. Teste de acesso protegido com token
echo "3️⃣  Acessando rota protegida com token..."
curl -s -X GET "$API/usuarios" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 4. Teste de acesso sem token (deve falhar)
echo "4️⃣  Acessando rota protegida sem token (deve retornar 401)..."
curl -s -X GET "$API/usuarios" | jq '.'
echo ""

# 5. Login com credenciais
echo "5️⃣  Login com credenciais..."
LOGIN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"senha\": \"$SENHA\"
  }")

echo "$LOGIN" | jq '.'
echo ""

echo "==============================================="
echo "Testes concluídos!"
echo "==============================================="
