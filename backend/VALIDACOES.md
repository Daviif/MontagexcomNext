### 📋 Validações com Express-Validator

Validações de input são aplicadas em todas as rotas para garantir dados válidos antes de atingir o banco de dados.

#### Estrutura

**Arquivo**: `src/validators/index.js`
- Validadores para cada entidade (Usuario, Servico, Rota, etc)
- Validadores genéricos (paginação, UUID params)
- Middleware `handleValidationErrors` para capture de erros

**Arquivo**: `src/validators/custom.js`
- Validadores customizados (CPF, hora, data no futuro, etc)

#### Como Usar

##### Validação em POST (Criar)

```javascript
const express = require('express');
const { usuarioValidators } = require('../validators');
const { models } = require('../models');

const router = express.Router();

router.post('/', usuarioValidators.create, async (req, res, next) => {
  try {
    const usuario = await models.Usuario.create(req.body);
    res.status(201).json(usuario);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

**Request válido:**
```json
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "senha": "senha123",
  "tipo": "montador"
}
```

**Request inválido:**
```json
{
  "nome": "Jo",
  "email": "email-invalido",
  "senha": "12"
}
```

**Response (400):**
```json
{
  "error": "Validação falhou",
  "details": [
    {
      "field": "nome",
      "message": "Nome deve ter entre 3 e 120 caracteres"
    },
    {
      "field": "email",
      "message": "Email inválido"
    },
    {
      "field": "senha",
      "message": "Senha deve ter pelo menos 6 caracteres"
    }
  ]
}
```

##### Validação em PUT (Atualizar)

```javascript
router.put('/:id', uuidParamValidator, usuarioValidators.update, handler);
```

Os validadores `.update` são opcionais, permitindo atualizações parciais.

##### Validação de Query Params

```javascript
router.get('/', paginationValidator, handler);
```

**Query válida:**
```
GET /usuarios?limit=10&offset=0&orderBy=nome&orderDir=ASC
```

**Query inválida:**
```
GET /usuarios?limit=500&orderDir=WRONG
```

**Response (400):**
```json
{
  "error": "Validação falhou",
  "details": [
    {
      "field": "limit",
      "message": "Limit deve estar entre 1 e 200"
    }
  ]
}
```

#### Validadores Disponíveis

##### Usuario

```javascript
// Create
usuarioValidators.create
// Valida: nome (3-120), email, senha (min 6), tipo

// Update
usuarioValidators.update
// Todos os campos são opcionais
```

##### Equipe

```javascript
equipeValidators.create    // nome (obrigatório)
equipeValidators.update    // nome, ativa (opcionais)
```

##### Loja

```javascript
lojaValidators.create      // nome (obrigatório), telefone, email, prazo_pagamento_dias
lojaValidators.update      // todos opcionais
```

##### Produto

```javascript
produtoValidators.create   // nome, tempo_base_min (obrigatórios)
produtoValidators.update   // todos opcionais
```

##### Serviço

```javascript
servicoValidators.create   // data_servico, tipo_cliente, endereco_execucao
servicoValidators.update   // status, valor_total (opcionais)
```

##### Rota

```javascript
rotaValidators.create      // data, equipe_id, horario_inicio, horario_fim
rotaValidators.update      // status, km_total, tempo_total_min (opcionais)
```

#### Validadores Customizados

**Arquivo**: `src/validators/custom.js`

##### Senha Forte

```javascript
const { senhaForte } = require('../validators/custom');

router.post('/', 
  body('email').isEmail(),
  senhaForte,  // Requer maiúsculas, minúsculas, números e caracteres especiais
  handler
);
```

##### CPF

```javascript
const { cpfValidator } = require('../validators/custom');

router.post('/', cpfValidator, handler);
```

##### Data no Futuro

```javascript
const { dataFuturaValidator } = require('../validators/custom');

router.post('/agendar', dataFuturaValidator, handler);
// Garante que a data é sempre no futuro
```

##### Intervalo de Datas

```javascript
const { intervaloDataValidator } = require('../validators/custom');

router.post('/relatorio', 
  intervaloDataValidator('data_inicio', 'data_fim'),
  handler
);
// Garante que data_fim > data_inicio
```

#### Combinando Validadores

```javascript
const express = require('express');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../validators');

const router = express.Router();

router.post('/', [
  body('titulo').trim().notEmpty().isLength({ min: 5, max: 100 }),
  body('descricao').trim().notEmpty().isLength({ min: 10 }),
  body('status').isIn(['draft', 'published', 'archived']),
  handleValidationErrors
], async (req, res, next) => {
  // Aqui os dados estão garantidamente válidos
  res.json({ ok: true });
});

module.exports = router;
```

#### Criando um Validador Customizado

```javascript
const { body, validationResult } = require('express-validator');

// Validador: telefone brasileiro
const telefoneBrasileiro = body('telefone')
  .matches(/^(?:\(\d{2}\)\s?)?\d{4,5}-?\d{4}$/)
  .withMessage('Telefone deve estar no formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX');

// Validador: URL válida
const urlValida = body('website')
  .isURL()
  .withMessage('Website deve ser uma URL válida');

// Validador: valor entre limites
const valorEntreLimites = (min, max) => 
  body('valor')
    .isDecimal()
    .custom(value => {
      if (value < min || value > max) {
        throw new Error(`Valor deve estar entre ${min} e ${max}`);
      }
      return true;
    });

module.exports = {
  telefoneBrasileiro,
  urlValida,
  valorEntreLimites
};
```

#### Tipos de Validação

| Tipo | Exemplo | Uso |
|------|---------|-----|
| **notEmpty** | `body('nome').notEmpty()` | Campo obrigatório |
| **isLength** | `isLength({ min: 3, max: 100 })` | Comprimento |
| **isEmail** | `isEmail()` | Email válido |
| **isInt** | `isInt({ min: 0 })` | Inteiro positivo |
| **isDecimal** | `isDecimal()` | Número com decimais |
| **isUUID** | `isUUID()` | UUID válido |
| **isISO8601** | `isISO8601()` | Data ISO |
| **isIn** | `isIn(['a', 'b'])` | Enum |
| **isURL** | `isURL()` | URL válida |
| **matches** | `matches(/pattern/)` | Regex |
| **custom** | `custom(fn)` | Lógica customizada |

#### Error Handling

Todos os validadores usam o middleware `handleValidationErrors` que captura erros e retorna:

```json
{
  "error": "Validação falhou",
  "details": [
    {
      "field": "nome",
      "message": "Campo obrigatório",
      "value": null
    }
  ]
}
```

#### Debugging

Para ver quais validadores estão sendo executados:

```javascript
const { validationResult } = require('express-validator');

app.use((req, res, next) => {
  console.log(`[Validação] ${req.method} ${req.path}`);
  next();
});
```
