#!/bin/bash

# Script de teste para validações

API="http://localhost:3000/api"

echo "==============================================="
echo "Teste de Validações"
echo "==============================================="
echo ""

# Registrar usuário para testes
echo "1️⃣  Criando usuário válido..."
USER=$(curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Usuário Teste",
    "email": "user-'$(date +%s)'@teste.com",
    "senha": "senha123",
    "tipo": "montador"
  }')

TOKEN=$(echo "$USER" | jq -r '.token')
echo "Token: $TOKEN"
echo ""

# Teste 1: Criar usuário com email inválido
echo "2️⃣  Teste: Email inválido (deve falhar)"
curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "email-invalido",
    "senha": "password123"
  }' | jq '.details[]'
echo ""

# Teste 2: Criar usuário com nome curto
echo "3️⃣  Teste: Nome muito curto (deve falhar)"
curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Jo",
    "email": "joao@teste.com",
    "senha": "password123"
  }' | jq '.details[]'
echo ""

# Teste 3: Criar usuário com senha curta
echo "4️⃣  Teste: Senha muito curta (deve falhar)"
curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@teste.com",
    "senha": "123"
  }' | jq '.details[]'
echo ""

# Teste 4: Criar usuario com tipo inválido
echo "5️⃣  Teste: Tipo de usuário inválido (deve falhar)"
curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@teste.com",
    "senha": "password123",
    "tipo": "gerenciador"
  }' | jq '.details[]'
echo ""

# Teste 5: Query params inválidos
echo "6️⃣  Teste: Query params inválidos (deve falhar)"
curl -s -X GET "$API/usuarios?limit=500&orderDir=WRONG" \
  -H "Authorization: Bearer $TOKEN" | jq '.details[]'
echo ""

# Teste 6: UUID inválido
echo "7️⃣  Teste: UUID inválido (deve falhar)"
curl -s -X GET "$API/usuarios/123-invalid" \
  -H "Authorization: Bearer $TOKEN" | jq '.details[]'
echo ""

# Teste 7: Criar loja com dados válidos
echo "8️⃣  Teste: Criar loja válida (deve passar)"
LOJA=$(curl -s -X POST "$API/lojas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nome": "Loja Teste",
    "telefone": "(11) 98765-4321",
    "email": "loja@teste.com",
    "prazo_pagamento_dias": 30
  }')

echo "$LOJA" | jq '.'
echo ""

# Teste 8: Criar loja com prazo inválido
echo "9️⃣  Teste: Prazo de pagamento inválido (deve falhar)"

echo "==============================================="
echo "Testes concluídos!"
echo "==============================================="
