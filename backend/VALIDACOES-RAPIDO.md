### 📋 Validações Express-Validator - Sumário Rápido

#### Instalação e setup

```bash
cd backend
npm install  # redis já está no package.json
```

#### Arquivos principais

- **Validadores**: `src/validators/index.js`
- **Customizados**: `src/validators/custom.js`
- **Exemplo de uso**: `src/examples/usuariosValidatedRouter.js`
- **Exemplo completo**: `src/examples/servicosCompleteRouter.js`

#### Uso básico

```javascript
const { usuarioValidators, handleValidationErrors } = require('../validators');

// Em uma rota
router.post('/usuarios', usuarioValidators.create, async (req, res) => {
  // Dados já foram validados
  const usuario = await Usuario.create(req.body);
  res.status(201).json(usuario);
});
```

#### Validadores por entidade

| Entidade | Create | Update | Campos |
|----------|--------|--------|--------|
| **Usuario** | ✅ | ✅ | nome(3-120), email, senha(6+), tipo |
| **Equipe** | ✅ | ✅ | nome(3-100), ativa |
| **Loja** | ✅ | ✅ | nome(3-150), telefone, email, prazo_dias(0-365) |
| **Cliente** | ✅ | ✅ | nome(3-150), telefone |
| **Produto** | ✅ | ✅ | nome(3-150), tempo_min, valor_base, ativo |
| **Serviço** | ✅ | ✅ | data, tipo_cliente, endereco, loja_id, status |
| **Rota** | ✅ | ✅ | data, equipe_id, horario_inicio, horario_fim |
| **Recebimento** | ✅ | ✅ | servico_id, valor, data_prevista, status |

#### Validadores genéricos

```javascript
import {
  paginationValidator,    // Valida: limit, offset, orderBy, orderDir
  uuidParamValidator      // Valida: :id como UUID
} from '../validators';
```

#### Customizados disponíveis

```javascript
import {
  senhaForte,             // Requer maiúscula, minúscula, número, caractere especial
  cpfValidator,           // Valida CPF brasileiro
  horaValidator,          // Formato HH:MM
  dataFuturaValidator,    // Garante data > hoje
  dataPassadaValidator,   // Garante data < hoje
  intervaloDataValidator  // Valida intervalo de datas
} from '../validators/custom';
```

#### Erro de validação (padrão)

```json
{
  "error": "Validação falhou",
  "details": [
    {
      "field": "email",
      "message": "Email inválido",
      "value": "email-invalido"
    }
  ]
}
```

#### Teste rápido

```bash
bash test-validations.sh
```

#### Próximos passos

Para integrar em rotas existentes:

1. Importar validadores necessários
2. Adicionar como middleware antes do handler
3. O middleware `handleValidationErrors` vai retornar 400 se houver erros

```javascript
router.post('/', 
  usuarioValidators.create,  // Valida
  handler                    // Executa se passou
);
```

Tudo pronto! 🎉
