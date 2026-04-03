# Scripts e Testes

Este diretório contém scripts administrativos e testes para o Montagex.

## Estrutura

```
backend/
├── scripts/          # Scripts administrativos e de migração
└── tests/           # Scripts de teste
```

## Scripts Administrativos (`scripts/`)

### recalcular-todos-servicos.js
Script para recalcular **todos** os valores de repasse de montagem no banco de dados baseado na configuração atual das lojas.

```bash
node scripts/recalcular-todos-servicos.js
```

**Quando usar:**
- Após alterar a configuração de porcentagem de repasse em uma loja
- Para sincronizar valores históricos com nova política de repasse
- Em operações administrativas de recálculo em massa

**Saída:**
- Lista de lojas processadas
- Total de serviços atualizados
- Total de montadores atualizados

---

### check-valores.js
Verifica e exibe valores atualizados no banco de dados. Foca na loja DULAR.

```bash
node scripts/check-valores.js
```

**Quando usar:**
- Após executar recálculos
- Para validar que valores foram atualizados corretamente
- Para debug de problemas de valores

**Saída:**
- Serviços da loja DULAR (últimos 5)
- Valores de repasse
- Distribuição entre montadores

---

### run-migration-008.js
Executa a migração 008 que torna `equipe_id` opcional na tabela rotas.

```bash
node scripts/run-migration-008.js
```

**Quando usar:**
- Durante inicialização se migração 008 não foi executada
- Em ambientes novos

---

## Scripts de Teste (`tests/`)

Os testes abaixo requerem que o servidor esteja rodando em `http://localhost:3000`.

### test-auth.sh
Testa autenticação JWT e acesso protegido.

```bash
bash tests/test-auth.sh
```

**Testes:**
1. ✅ Health check
2. ✅ Registro de novo usuário
3. ✅ Acesso com token válido
4. ✅ Rejeição sem token
5. ✅ Login com credenciais

**Pré-requisitos:**
- `curl` instalado
- `jq` instalado (para parsing JSON)

---

### test-redis.sh
Verifica conexão com Redis e estado do cache.

```bash
bash tests/test-redis.sh
```

**Verifica:**
- Conexão com Redis
- Versão do servidor
- Chaves cacheadas
- Uso de memória

**Pré-requisitos:**
- `redis-cli` instalado

---

### test-socket.sh
Testa conexão WebSocket com autenticação.

```bash
bash tests/test-socket.sh
```

**Funcionalidades:**
- Autenticação via JWT
- Eventos de serviço e rota
- Notificações em tempo real
- Testes interativos

**Pré-requisitos:**
- `socket.io-client` instalado
- `node` instalado

---

### test-validations.sh
Testa validações de entrada na API.

```bash
bash tests/test-validations.sh
```

**Testes:**
1. Email inválido
2. Nome muito curto
3. Senha muito curta
4. Tipo de usuário inválido
5. Query params inválidos
6. UUID inválido
7. Criação de loja válida
8. Prazo de pagamento inválido

---

### test-recalculo.js
Testa automaticamente o recálculo de valores ao alterar porcentagem de repasse.

```bash
node tests/test-recalculo.js
```

**O que testa:**
1. Busca loja DULAR
2. Busca serviço da loja
3. Altera porcentagem de 10% para 15%
4. Valida se serviço foi recalculado corretamente
5. Valida se montadores foram atualizados corretamente
6. Reverte alterações

**Resultado esperado:**
- ✅ Valores recalculados corretamente
- ✅ Montadores sincronizados
- ✅ Dados restaurados ao final

---

## Como Executar em Produção

```bash
# Recalcular todos os serviços
npm run script:recalcular

# Verificar valores
npm run script:check

# Executar migração
npm run script:migrate
```

Adicionar ao `package.json`:
```json
{
  "scripts": {
    "script:recalcular": "node scripts/recalcular-todos-servicos.js",
    "script:check": "node scripts/check-valores.js",
    "script:migrate": "node scripts/run-migration-008.js"
  }
}
```

---

## Troubleshooting

**Erro: "DATABASE_URL não definida"**
- Certifique-se que `.env` está configurado corretamente
- Verifique conexão com o banco de dados

**Erro: "Redis não está disponível"**
- Inicie Redis: `redis-server`
- Ou use Docker: `docker run -d -p 6379:6379 redis:latest`

**Erro: "Socket connection failed"**
- Verifique se o servidor está rodando em `http://localhost:3000`
- Verifique se WebSocket está habilitado no servidor

---

## Notas

- Scripts de migração devem ser executados uma única vez
- Recálculos em massa podem demorar dependendo do volume de dados
- Testes requerem que o servidor esteja em execução
- Use `.env.example` como referência para configuração
