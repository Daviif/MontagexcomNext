# 🔄 Sistema de Recálculo Automático - Implementação Completa

## ✅ Implementado com Sucesso

### 📦 Arquivos Criados/Modificados

#### Novos Arquivos
1. **`backend/src/utils/recalculos.js`** (173 linhas)
   - Funções centralizadas de recálculo
   - `recalcularValorRepasseServico()`
   - `recalcularValoresMontadores()`
   - `recalcularServicosLoja()`
   - `recalcularValorMontador()`

#### Arquivos Modificados
2. **`backend/src/models/Loja.js`**
   - ✅ Hook `afterUpdate` 
   - Dispara quando `usa_porcentagem` ou `porcentagem_repasse` muda
   - Recalcula todos os serviços da loja automaticamente

3. **`backend/src/models/Servico.js`**
   - ✅ Hook `afterUpdate`
   - Dispara quando `valor_total` ou `valor_repasse_montagem` muda
   - Recalcula todos os montadores do serviço

4. **`backend/src/models/ServicoMontador.js`**
   - ✅ Hook `afterCreate` - Ao adicionar montador
   - ✅ Hook `afterUpdate` - Ao mudar `percentual_divisao`
   - ✅ Hook `afterDestroy` - Ao remover montador
   - Recalcula divisão entre todos os montadores

5. **`backend/src/routes/lojas.js`**
   - ✅ Simplificado (de 145 linhas para 20)
   - Hooks fazem o trabalho automaticamente
   - Apenas atualiza a loja, recálculo é automático

6. **`backend/src/routes/dashboardSalarios.js`**
   - ✅ Sempre recalcula em tempo real
   - Não usa `valor_atribuido` antigo do banco
   - Prioriza `valor_repasse_montagem` atual

---

## 🎯 Fluxo de Recálculo Automático

### Cenário 1: Editar Porcentagem da Loja
```
┌─────────────────────────────────────────┐
│ Usuário edita loja DULAR                │
│ usa_porcentagem: false → true           │
│ porcentagem_repasse: null → 10%         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Hook Loja.afterUpdate detecta mudança   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ recalcularServicosLoja(lojaId)          │
│ • Busca todos os serviços da loja       │
│ • Para cada serviço:                    │
│   - valor_repasse = total × 10%         │
│   - Atualiza banco (hooks: false)       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ recalcularValoresMontadores(servicoId)  │
│ • Para cada montador do serviço:        │
│   - Se tem percentual_divisao:          │
│     valor = repasse × percentual        │
│   - Senão:                              │
│     valor = repasse ÷ total_montadores  │
│   - Atualiza banco (hooks: false)       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Console: ✅ 47 serviço(s) recalculados  │
│ Frontend: Valores atualizados           │
└─────────────────────────────────────────┘
```

### Cenário 2: Adicionar Montador ao Serviço
```
┌─────────────────────────────────────────┐
│ Usuário adiciona 2º montador           │
│ Serviço tinha: 1 montador (100%)        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Hook ServicoMontador.afterCreate        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ recalcularValoresMontadores(servicoId)  │
│ • Total montadores: 1 → 2               │
│ • Montador 1: R$ 147,24 → R$ 73,62      │
│ • Montador 2: R$ 0,00 → R$ 73,62        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Frontend: Valores atualizados           │
└─────────────────────────────────────────┘
```

### Cenário 3: Editar Valor Total do Serviço
```
┌─────────────────────────────────────────┐
│ Usuário edita serviço                   │
│ valor_total: R$ 1000 → R$ 1500          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Hook Servico.afterUpdate detecta mudança│
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Recalcula valor_repasse_montagem        │
│ • Se loja usa 10%:                      │
│   R$ 1500 × 10% = R$ 150                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ recalcularValoresMontadores(servicoId)  │
│ • 2 montadores: R$ 150 ÷ 2 = R$ 75 cada │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Frontend: Valores atualizados           │
└─────────────────────────────────────────┘
```

---

## 🧪 Como Testar

### Teste 1: Alterar Porcentagem da Loja ✅
1. Abrir tela **Clientes > Lojas**
2. Editar loja DULAR
3. Marcar "Usa porcentagem" = ✅
4. Definir "Porcentagem" = **8%**
5. Clicar em **Salvar**

**Resultado Esperado:**
- Console backend: `🔄 Recalculando X serviços da loja DULAR...`
- Console backend: `✅ X serviço(s) recalculado(s)`
- Dashboard Financeiro mostra valores atualizados (após F5)

### Teste 2: Adicionar Segundo Montador ✅
1. Abrir tela **Serviços**
2. Criar novo serviço com **1 montador**
3. Salvar (montador recebe 100%)
4. Editar e adicionar **2º montador**
5. Salvar

**Resultado Esperado:**
- Montador 1: `valor_atribuido` reduz para 50%
- Montador 2: `valor_atribuido` = 50%
- Soma = 100% do `valor_repasse_montagem`

### Teste 3: Editar Valor do Serviço ✅
1. Abrir serviço existente
2. Alterar `valor_total` de R$ 1000 para R$ 1500
3. Salvar

**Resultado Esperado:**
- `valor_repasse_montagem` recalculado (com % da loja)
- `valor_atribuido` de cada montador recalculado
- Dashboard atualizado

---

## 📊 Fórmulas de Cálculo

### Valor de Repasse (Loja → Serviço)
```javascript
if (loja.usa_porcentagem && loja.porcentagem_repasse > 0) {
  valor_repasse_montagem = (valor_total × porcentagem_repasse) / 100
} else {
  valor_repasse_montagem = valor_total
}
```

### Valor Atribuído (Serviço → Montador)
```javascript
if (montador.percentual_divisao != null && percentual_divisao > 0) {
  // Divisão personalizada
  valor_atribuido = (valor_repasse_montagem × percentual_divisao) / 100
} else {
  // Divisão igual
  valor_atribuido = valor_repasse_montagem / total_montadores
}
```

---

## ⚠️ Prevenção de Loops Infinitos

Todos os hooks usam `{ hooks: false }` ao atualizar:

```javascript
await servico.update(
  { valor_repasse_montagem: novoValor },
  { hooks: false } // ⚠️ Não dispara hooks novamente!
);
```

Isso evita que:
- Hook A atualize registro → dispare Hook B
- Hook B atualize registro → dispare Hook A
- Loop infinito ❌

---

## 🎯 Benefícios

✅ **Zero Scripts Manuais:** Nunca mais executar recalcular-todos-servicos.js  
✅ **Dados Sempre Sincronizados:** Valores consistentes em tempo real  
✅ **Transparente:** Logs no console mostram recálculos  
✅ **Performático:** Recalcula apenas o necessário  
✅ **Seguro:** Previne loops infinitos  
✅ **Automático:** Funciona sem intervenção do usuário  

---

## 📝 Comparação: Antes vs Depois

### ❌ ANTES (Sistema Antigo)
```
1. Usuário edita loja
2. Valores não são recalculados
3. Dashboard mostra valores ERRADOS
4. Dev precisa executar script manual:
   $ node recalcular-todos-servicos.js
5. Valores finalmente corretos
```

### ✅ DEPOIS (Sistema Novo)
```
1. Usuário edita loja
2. Sistema recalcula AUTOMATICAMENTE
3. Dashboard mostra valores CORRETOS
4. Fim ✅
```

---

## 🔍 Troubleshooting

### Valores não atualizaram
1. ✅ Verificar console backend (deve ter logs de recálculo)
2. ✅ Dar F5 no frontend
3. ✅ Verificar se campo realmente mudou

### Hook não está disparando
1. ✅ Verificar se campo mudou (Sequelize usa `.changed()`)
2. ✅ Verificar logs de erro no console
3. ✅ Reiniciar servidor backend

### Valor errado após recálculo
1. ✅ Verificar `porcentagem_repasse` da loja
2. ✅ Verificar `percentual_divisao` do montador
3. ✅ Verificar `valor_total` do serviço

---

## 📂 Estrutura de Arquivos

```
backend/
├── src/
│   ├── models/
│   │   ├── Loja.js              ✅ Hook afterUpdate
│   │   ├── Servico.js           ✅ Hook afterUpdate
│   │   └── ServicoMontador.js   ✅ Hooks after Create/Update/Destroy
│   ├── routes/
│   │   ├── lojas.js             ✅ Simplificado
│   │   └── dashboardSalarios.js ✅ Cálculo em tempo real
│   └── utils/
│       └── recalculos.js        ✅ NOVO - Funções centralizadas
└── recalcular-todos-servicos.js (script manual - uso excepcional)
```

---

## 🚀 Deploy

**Nenhuma migration necessária!**

Os hooks funcionam automaticamente ao:
1. Reiniciar servidor backend
2. Fazer próxima edição de loja/serviço/montador

**Dados antigos:**
- Use script manual UMA VEZ para corrigir: `node recalcular-todos-servicos.js`
- Depois disso, tudo será automático ✅
