# 🔄 Recálculo Automático de Valores - Sistema Completo

## 📋 Visão Geral

O sistema agora recalcula **automaticamente** todos os valores financeiros sempre que há alterações que afetam cálculos. **Não é mais necessário executar scripts manuais.**

## 🎯 Recálculos Automáticos Implementados

### 1. **Alteração de Loja** 

**Quando:** `usa_porcentagem` ou `porcentagem_repasse` é alterado

**Hook:** `Loja.afterUpdate` (model)

**O que recalcula:**
- ✅ `valor_repasse_montagem` de todos os serviços da loja
- ✅ `valor_atribuido` de todos os montadores desses serviços

**Console log:**
```
🔄 Recalculando 47 serviços da loja DULAR...
✅ Recálculo concluído: 47 serviço(s) atualizados
```

---

### 2. **Alteração de Serviço**

**Quando:** `valor_total` ou `valor_repasse_montagem` é alterado

**Hook:** `Servico.afterUpdate` (model)

**O que recalcula:**
- ✅ `valor_atribuido` de todos os montadores do serviço

---

### 3. **Montador Adicionado/Removido/Alterado**

**Quando:** 
- Montador é criado (CREATE)
- `percentual_divisao` é alterado (UPDATE)
- Montador é removido (DELETE)

**Hooks:** `ServicoMontador.afterCreate/afterUpdate/afterDestroy` (model)

**O que recalcula:**
- ✅ `valor_atribuido` de todos os montadores do serviço
- ✅ Redistribui valores conforme divisão (igual ou percentual)

### Como Usar

#### No Frontend (Página Clientes):

1. Abra a aba **"Lojas"**
2. Edite a loja desejada
3. Marque/desmarque **"Usa porcentagem para repasse"**
4. Se marcado, defina a **"Porcentagem de repasse"** (ex: 2, 5, 10)
5. Clique em **Salvar**

**O sistema irá:**
- ✅ Recalcular TODOS os serviços da loja
- ✅ Atualizar valores no dashboard de salários
- ✅ Não precisará rodar scripts manuais

#### Exemplo Prático:

**Loja DULAR:**
- Estava: `usa_porcentagem: false, porcentagem_repasse: null`
- Resultado: Montadores recebiam 100% do valor (R$ 1.472,35)

**Após Correção:**
- Configurar: `usa_porcentagem: true, porcentagem_repasse: 2`
- Resultado: Montadores recebem 2% do valor (R$ 29,45) ✅

## 📝 Outras Correções Implementadas

### 1. Prevenção de Duplicação de Montadores

**Migration:** `007_unique_servico_montador.sql`
- Remove duplicatas existentes
- Adiciona constraint UNIQUE (servico_id, usuario_id)

### 2. Correção do Cálculo de Salários

**Arquivos modificados:**
- `backend/src/routes/dashboardSalarios.js`
- `frontend-desktop/src/pages/Financeiro/Financeiro.jsx`
- `frontend-desktop/src/pages/Servicos/Servicos.jsx`

**Mudanças:**
- Prioriza `valor_repasse_montagem` (já calculado)
- Remove duplicatas antes de salvar montadores
- Separa `valorCheio` de `valorCalculadoCliente`

## 🚀 Como Testar

1. **Reinicie o backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **No frontend:**
   - Acesse **Clientes > Lojas**
   - Edite a loja DULAR
   - Marque "Usa porcentagem" e defina 2%
   - Salve

3. **Verifique:**
   - Vá em **Financeiro > Salários**
   - O montador Walaf Carlos deve mostrar **R$ 29,45** ✅

## 📊 Fluxo Completo

```
1. Usuário edita loja no frontend
         ↓
2. Frontend envia PUT /lojas/:id
         ↓
3. Backend detecta mudança de porcentagem
         ↓
4. Backend busca TODOS os serviços da loja
         ↓
5. Para cada serviço:
   - Recalcula valor_repasse_montagem
   - Busca montadores do serviço
   - Recalcula valor_atribuido de cada montador
         ↓
6. Backend retorna loja atualizada
         ↓
7. Frontend recarrega dados
         ↓
8. Dashboard de salários mostra valores corretos ✅
```

## ⚠️ Importante

- **Só recalcula serviços existentes** - Serviços futuros usarão automaticamente a nova porcentagem
- **Respeita percentual_divisao** - Se montador tem divisão personalizada, ela é mantida
- **Log no console** - Mostra no terminal quantos serviços foram recalculados

## 🔧 Troubleshooting

**Se os valores não atualizarem:**
1. Verifique o console do backend - deve mostrar "Recalculando serviços..."
2. Recarregue a página do frontend (F5)
3. Verifique se o backend está rodando
4. Cheque o console do navegador por erros

**Se aparecerem duplicatas:**
1. Execute a migration: `database/migrations/007_unique_servico_montador.sql`
2. Ou use o script: `node database/migrations/fix-salarios.js`
