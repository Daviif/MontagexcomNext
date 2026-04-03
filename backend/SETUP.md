# 🚀 Backend - Checklist de Configuração

Guia de implantação e verificação de tudo que foi configurado no backend.

## ✅ Componentes Implementados

### 1. **Autenticação JWT** ✔️
- [x] Middleware de autenticação
- [x] Rota `/auth/login`
- [x] Rota `/auth/register` com hash de senha (bcrypt)
- [x] Verificação de token em requisições protegidas
- [x] Token com expiração de 7 dias

**Documentação**: [AUTENTICACAO.md](./AUTENTICACAO.md)
**Teste**: `bash test-auth.sh`

---

### 2. **WebSocket (Socket.io)** ✔️
- [x] Configuração com autenticação JWT
- [x] Salas de sincronização (servico, rota, equipe)
- [x] Eventos em tempo real
- [x] Rastreamento de localização
- [x] Notificações push

**Documentação**: [WEBSOCKET.md](./WEBSOCKET.md)
**Teste**: `bash test-socket.sh`

---

### 3. **Redis Cache** ✔️
- [x] Integração com servidor
- [x] Middleware de cache global
- [x] Cache por rota específica
- [x] Rate limiting
- [x] Gerenciador de sessões
- [x] Contadores e estatísticas

**Documentação**: [REDIS.md](./REDIS.md)
**Teste**: `bash test-redis.sh`

---

### 4. **Validações de Input** ✔️
- [x] Validador para Usuario (nome, email, senha, tipo)
- [x] Validador para Equipe
- [x] Validador para Loja
- [x] Validador para Cliente Particular
- [x] Validador para Produto
- [x] Validador para Serviço
- [x] Validador para Rota
- [x] Validador para Recebimento
- [x] Validadores customizados (CPF, hora, datas, etc)
- [x] Paginação validada
- [x] UUID params validados

**Documentação**: [VALIDACOES.md](./VALIDACOES.md)
**Teste**: `bash test-validations.sh`

---

### 5. **ORM (Sequelize)** ✔️
- [x] Modelos para todas as tabelas
- [x] Associações (relationships)
- [x] Índices de banco

---

## 🔧 Setup Inicial

### 1. Instalar Dependências
```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente
```bash
cp .env.example .env
```

**Editar `.env` com suas credenciais:**
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=montagex
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_LOGGING=false
JWT_SECRET=gerar_com: openssl rand -hex 32
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=*
```

### 3. Gerar JWT_SECRET
```bash
bash generate-secret.sh
```

### 4. Iniciar Serviços

**PostgreSQL:**
```bash
# Docker
docker run -d \
  -e POSTGRES_DB=montagex \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15
```

**Redis:**
```bash
# Docker
docker run -d -p 6379:6379 redis:latest
```

### 5. Rodar Servidor
```bash
npm run dev
```

Server rodando em `http://localhost:3000`

---

## 🧪 Testes

### Teste de Health Check
```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{ "status": "ok" }
```

### Teste de Autenticação
```bash
bash test-auth.sh
```

### Teste de WebSocket
```bash
bash test-socket.sh
```

### Teste de Redis
```bash
bash test-redis.sh
```

### Teste de Validações
```bash
bash test-validations.sh
```

---

## 📚 Documentação de Recursos

| Recurso | Arquivo | Descrição |
|---------|---------|-----------|
| Autenticação | `AUTENTICACAO.md` | JWT, login, registro |
| WebSocket | `WEBSOCKET.md` | Tempo real, eventos, salas |
| Cache | `REDIS.md` | Cache, rate limiting, sessões |
| Validações | `VALIDACOES.md` | Input validation, schemas |

---

## 🏗️ Estrutura do Projeto

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # Conexão Sequelize
│   │   ├── redis.js          # Conexão Redis
│   │   └── websocket.js      # Socket.io setup
│   ├── middleware/
│   │   ├── auth.js           # JWT verification
│   │   └── cache.js          # Cache middleware
│   ├── models/               # Sequelize models
│   ├── routes/
│   │   ├── index.js          # Main router
│   │   ├── auth.js           # /auth routes
│   │   ├── crudRouter.js     # Generic CRUD
│   ├── validators/
│   │   ├── index.js          # Validation schemas
│   │   └── custom.js         # Custom validators
│   ├── utils/
│   │   ├── cache.js          # Cache utilities
│   │   └── websocket.js      # Socket.io helpers
│   ├── examples/             # Code examples
│   ├── app.js                # Express app
│   └── server.js             # Entry point
├── .env.example              # Environment template
├── package.json              # Dependencies
├── AUTENTICACAO.md           # JWT docs
├── WEBSOCKET.md              # Socket.io docs
├── REDIS.md                  # Cache docs
├── VALIDACOES.md             # Validation docs
└── generate-secret.sh        # JWT secret generator
```

---

## 🔌 Endpoints Principais

### Health Check
```
GET /api/health
```

### Autenticação (Público)
```
POST /api/auth/login
POST /api/auth/register
```

### Usuários (Protegido)
```
GET    /api/usuarios              # Listar (com paginação)
GET    /api/usuarios/:id          # Obter um
POST   /api/usuarios              # Criar (validado)
PUT    /api/usuarios/:id          # Atualizar (validado)
DELETE /api/usuarios/:id          # Deletar
```

### Equipes, Lojas, Produtos, Servicos, Rotas... (Todos protegidos e validados)
```
GET    /api/{resource}            # Listar
GET    /api/{resource}/:id        # Obter
POST   /api/{resource}            # Criar
PUT    /api/{resource}/:id        # Atualizar
DELETE /api/{resource}/:id        # Deletar
```

---

## 🔐 Segurança Implementada

- ✅ CORS configurado
- ✅ Helmet (security headers)
- ✅ Compression (gzip)
- ✅ JWT authentication
- ✅ Rate limiting (Redis)
- ✅ Validação de input
- ✅ Hashing de senha (bcrypt)
- ✅ UUID para IDs (evita enumerate)

---

## 📈 Performance

- ✅ Redis cache (reduz queries)
- ✅ Connection pooling (Sequelize)
- ✅ Query optimization (índices de BD)
- ✅ Compression middleware
- ✅ Morgan logging

---

## 🐛 Troubleshooting

### Redis não conecta
```
Redis não está acessível. Cache desabilitado.
```
**Solução**: `docker run -d -p 6379:6379 redis:latest`

### Erro de CORS
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solução**: Ajustar `CORS_ORIGIN` no `.env`

### JWT inválido
```
Token ausente
Token inválido ou expirado
```
**Solução**: Faça login novamente: `POST /api/auth/login`

### Erro de validação
```json
{
  "error": "Validação falhou",
  "details": [...]
}
```
**Solução**: Verificar dados contra documentação em `VALIDACOES.md`

---

## 📝 Próximos Passos

- [ ] Implementar migrations automáticas de BD
- [ ] Adicionar testes automatizados (Jest)
- [ ] Deploy em produção (Docker Compose)
- [ ] Monitoramento (Sentry, DataDog)
- [ ] API docs (Swagger/OpenAPI)
- [ ] Refresh tokens
- [ ] 2FA (Two-factor authentication)
- [ ] Audit logs

---

## 🤝 Contribuindo

1. Criar feature branch: `git checkout -b feature/nova-feature`
2. Fazer alterações e validações
3. Testar: `npm test`
4. Commit: `git commit -am 'Descrição'`
5. Push: `git push origin feature/nova-feature`

---

## 📞 Suporte

Dúvidas? Consulte a documentação específica:
- JWT: [AUTENTICACAO.md](./AUTENTICACAO.md)
- Tempo Real: [WEBSOCKET.md](./WEBSOCKET.md)
- Cache: [REDIS.md](./REDIS.md)
- Validações: [VALIDACOES.md](./VALIDACOES.md)
