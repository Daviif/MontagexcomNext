### 🔐 Autenticação JWT

A API utiliza JSON Web Tokens (JWT) para autenticação. Todas as rotas, exceto `/api/auth/login` e `/api/auth/register`, requerem um token válido.

#### Endpoints

##### `POST /api/auth/register` - Registro de novo usuário

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@example.com",
    "senha": "senhaSegura123",
    "tipo": "montador"
  }'
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "João Silva",
    "email": "joao@example.com",
    "tipo": "montador"
  }
}
```

---

##### `POST /api/auth/login` - Login

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "senha": "senhaSegura123"
  }'
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "João Silva",
    "email": "joao@example.com",
    "tipo": "montador"
  }
}
```

---

#### Acessar Rotas Protegidas

Todas as rotas (exceto `/api/auth/*` e `/api/health`) requerem autenticação.

**Header obrigatório:**
```
Authorization: Bearer {token}
```

**Exemplo:**
```bash
curl -X GET http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

#### Ciclo de vida do Token

- **Expiração**: 7 dias
- **Refresh**: Faça login novamente para obter um novo token
- **Verificação**: O servidor valida o token em cada requisição

#### Variáveis de Ambiente

Certifique-se de configurar no `.env`:

```env
JWT_SECRET=sua_chave_secreta_super_segura_aqui
```

> ⚠️ **IMPORTANTE**: Use uma chave secreta forte em produção!

```bash
# Gerar uma chave segura (OpenSSL)
openssl rand -hex 32
```
