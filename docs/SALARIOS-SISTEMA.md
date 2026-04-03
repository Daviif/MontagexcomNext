# 💰 Sistema de Salários e Repasse de Montagem

## 📋 Resumo das Mudanças

Este documento detalha as modificações implementadas no sistema para suportar:
1. ✅ Indexação de valores de serviço a montadores individuais ou equipes
2. ✅ Card "Salário" no dashboard financeiro
3. ✅ Configuração de fórmula de cálculo de salário
4. ✅ Porcentagem de repasse configurável por loja

---

## 🗄️ Mudanças no Banco de Dados

### 1. Nova Tabela: `configuracoes`

Armazena configurações globais do sistema:

```sql
CREATE TABLE configuracoes (
    id UUID PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descricao TEXT,
    tipo VARCHAR(50), -- 'texto', 'numero', 'percentual', 'formula'
    updated_at TIMESTAMP
);
```

**Configurações Padrão:**
- `salario_formula`: Fórmula para cálculo de salário (ex: "valor_montagem", "valor_montagem * 1.1")
- `salario_base_padrao`: Valor fixo adicional ao salário

### 2. Nova Tabela: `servico_montadores`

Relaciona serviços com montadores/equipes e seus respectivos valores:

```sql
CREATE TABLE servico_montadores (
    id UUID PRIMARY KEY,
    servico_id UUID NOT NULL,
    
    -- Montador individual OU equipe (apenas um deve ser preenchido)
    usuario_id UUID,
    equipe_id UUID,
    
    valor_atribuido NUMERIC(10,2) NOT NULL,
    percentual_divisao NUMERIC(5,2),
    papel VARCHAR(20), -- 'principal' ou 'auxiliar'
    
    created_at TIMESTAMP
);
```

**Regras:**
- Cada registro deve ter **OU** `usuario_id` **OU** `equipe_id` (não ambos)
- `valor_atribuido`: valor que este montador/equipe vai receber
- `percentual_divisao`: percentual dentro do serviço (ex: 70% principal, 30% auxiliar)

### 3. Modificações na Tabela `lojas`

Adição de campos para configuração de repasse:

```sql
ALTER TABLE lojas ADD COLUMN usa_porcentagem BOOLEAN DEFAULT false;
ALTER TABLE lojas ADD COLUMN porcentagem_repasse NUMERIC(5,2);
ALTER TABLE lojas ADD COLUMN observacoes_pagamento TEXT;
```

**Campos adicionados:**
- `usa_porcentagem`: Se `true`, o repasse é calculado como % do valor do móvel
- `porcentagem_repasse`: Percentual de repasse (ex: 5.00 = 5%)
- `observacoes_pagamento`: Notas sobre o acordo de pagamento

**Exemplo:**
```json
{
  "nome": "Móveis Alfa",
  "usa_porcentagem": true,
  "porcentagem_repasse": 5.00,
  "observacoes_pagamento": "5% sobre o valor de cada móvel montado"
}
```

### 4. Modificações na Tabela `servicos`

Adição de campo para valor de repasse:

```sql
ALTER TABLE servicos ADD COLUMN valor_repasse_montagem NUMERIC(10,2);
```

**Campo adicionado:**
- `valor_repasse_montagem`: Valor total que será distribuído aos montadores

---

## 🔌 Novos Endpoints da API

### 1. Configurações

#### GET `/api/v1/configuracoes`
Listar todas as configurações

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "chave": "salario_formula",
      "valor": "valor_montagem * 1.1",
      "descricao": "Adiciona 10% sobre o valor das montagens",
      "tipo": "formula"
    }
  ]
}
```

#### PUT `/api/v1/configuracoes/:id`
Atualizar configuração

**Request:**
```json
{
  "valor": "valor_montagem * 1.15"
}
```

### 2. Montadores de Serviço

#### GET `/api/v1/servico_montadores?servico_id=uuid`
Listar montadores de um serviço

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "servico_id": "uuid-servico",
      "usuario_id": "uuid-montador",
      "equipe_id": null,
      "valor_atribuido": 350.00,
      "percentual_divisao": 70.00,
      "papel": "principal",
      "usuario": {
        "nome": "Carlos Silva"
      }
    },
    {
      "id": "uuid",
      "servico_id": "uuid-servico",
      "usuario_id": "uuid-montador-2",
      "equipe_id": null,
      "valor_atribuido": 150.00,
      "percentual_divisao": 30.00,
      "papel": "auxiliar",
      "usuario": {
        "nome": "João Santos"
      }
    }
  ]
}
```

#### POST `/api/v1/servico_montadores`
Atribuir montador/equipe a um serviço

**Request (Montador Individual):**
```json
{
  "servico_id": "uuid",
  "usuario_id": "uuid",
  "valor_atribuido": 500.00,
  "percentual_divisao": 100.00,
  "papel": "principal"
}
```

**Request (Equipe - Divisão Automática):**
```json
{
  "servico_id": "uuid",
  "equipe_id": "uuid",
  "valor_atribuido": 500.00
}
```

> **Nota:** Quando atribuir a uma equipe, o valor será dividido igualmente entre os membros automaticamente.

### 3. Dashboard - Endpoint de Salários

#### GET `/api/v1/dashboard/salarios`
Obter salários calculados dos montadores

**Query Params:**
- `data_inicio` (opcional): Data inicial (YYYY-MM-DD)
- `data_fim` (opcional): Data final (YYYY-MM-DD)
- `usuario_id` (opcional): Filtrar por montador específico

**Response:**
```json
{
  "success": true,
  "data": {
    "periodo": {
      "inicio": "2024-02-01",
      "fim": "2024-02-29"
    },
    "formula_atual": "valor_montagem * 1.1",
    "montadores": [
      {
        "usuario_id": "uuid",
        "nome": "Carlos Silva",
        "servicos_realizados": 12,
        "valor_montagens": 4500.00,
        "valor_base": 0.00,
        "salario_calculado": 4950.00,
        "detalhes": [
          {
            "servico_id": "uuid",
            "codigo_os_loja": "SRV-2024-001",
            "data_servico": "2024-02-05",
            "valor_atribuido": 350.00,
            "papel": "principal"
          }
        ]
      },
      {
        "usuario_id": "uuid-2",
        "nome": "João Santos",
        "servicos_realizados": 15,
        "valor_montagens": 3200.00,
        "valor_base": 0.00,
        "salario_calculado": 3520.00,
        "detalhes": [...]
      }
    ],
    "totais": {
      "total_montadores": 2,
      "total_servicos": 27,
      "total_valor_montagens": 7700.00,
      "total_salarios": 8470.00
    }
  }
}
```

---

## 💻 Requisitos do Frontend

### 1. Tela de Configurações (`Settings`)

**Localização:** Menu lateral → Settings

**Componentes:**

#### Seção: Cálculo de Salário

```jsx
<Card title="Configuração de Salários">
  <FormField 
    label="Fórmula de Cálculo"
    name="salario_formula"
    type="select"
    options={[
      { value: 'valor_montagem', label: 'Valor exato das montagens' },
      { value: 'valor_montagem * 1.1', label: 'Valor das montagens + 10%' },
      { value: 'valor_montagem * 1.15', label: 'Valor das montagens + 15%' },
      { value: 'valor_montagem * 1.2', label: 'Valor das montagens + 20%' },
      { value: 'custom', label: 'Personalizado' }
    ]}
  />
  
  {formula === 'custom' && (
    <FormField
      label="Fórmula Personalizada"
      name="custom_formula"
      type="text"
      placeholder="Ex: (valor_montagem * 1.25) + 500"
      help="Use 'valor_montagem' como variável"
    />
  )}
  
  <FormField
    label="Salário Base Adicional (R$)"
    name="salario_base_padrao"
    type="number"
    step="0.01"
    help="Valor fixo adicionado ao salário de todos os montadores"
  />
  
  <Button onClick={saveConfiguracoes}>Salvar Configurações</Button>
</Card>
```

**API Calls:**
```javascript
// Carregar configurações
const { data } = await api.get('/configuracoes');
const salariorFormula = data.find(c => c.chave === 'salario_formula');

// Salvar configurações
await api.put(`/configuracoes/${configuracao.id}`, {
  valor: newFormula
});
```

---

### 2. Formulário de Cadastro de Loja (Atualizado)

**Localização:** Clientes → Lojas → Nova Loja / Editar

**Novos Campos:**

```jsx
<Card title="Configuração de Repasse">
  <FormField
    label="Tipo de Cálculo"
    name="usa_porcentagem"
    type="switch"
    onLabel="Porcentagem do móvel"
    offLabel="Valor fixo por serviço"
  />
  
  {lojaData.usa_porcentagem && (
    <>
      <FormField
        label="Porcentagem de Repasse (%)"
        name="porcentagem_repasse"
        type="number"
        step="0.01"
        min="0"
        max="100"
        suffix="%"
        help="Percentual sobre o valor de cada móvel montado"
      />
      
      <Alert type="info">
        Exemplo: Se o guarda-roupa custa R$ 1.500,00 e a porcentagem é 5%, 
        o repasse será R$ 75,00
      </Alert>
    </>
  )}
  
  <FormField
    label="Observações de Pagamento"
    name="observacoes_pagamento"
    type="textarea"
    placeholder="Ex: Pagamento até o dia 15 de cada mês"
  />
</Card>
```

**Cálculo Dinâmico no Frontend:**
```javascript
// Calcular valor de repasse ao criar serviço
const calcularValorRepasse = (loja, produtos) => {
  if (loja.usa_porcentagem) {
    // Soma o valor de todos os produtos
    const valorTotalProdutos = produtos.reduce(
      (sum, p) => sum + (p.valor_unitario * p.quantidade), 
      0
    );
    // Aplica a porcentagem
    return valorTotalProdutos * (loja.porcentagem_repasse / 100);
  } else {
    // Valor fixo configurado no serviço
    return servicoData.valor_repasse_montagem || 0;
  }
};
```

---

### 3. Formulário de Cadastro de Serviço (Atualizado)

**Localização:** Serviços → Novo Serviço / Editar

**Seção Atualizada: Montadores e Valores**

```jsx
<Card title="Montadores e Divisão de Valores">
  <FormField
    label="Valor Total do Serviço (R$)"
    name="valor_total"
    type="number"
    step="0.01"
    readOnly
    value={calcularValorTotal()}
  />
  
  <FormField
    label="Valor de Repasse para Montagem (R$)"
    name="valor_repasse_montagem"
    type="number"
    step="0.01"
    value={calcularValorRepasse()}
    help={lojaData?.usa_porcentagem 
      ? `Calculado como ${lojaData.porcentagem_repasse}% do valor dos produtos`
      : 'Valor fixo configurado'
    }
  />
  
  <Divider />
  
  <FormField
    label="Tipo de Atribuição"
    name="tipo_atribuicao"
    type="radio"
    options={[
      { value: 'individual', label: 'Montadores individuais' },
      { value: 'equipe', label: 'Equipe completa' }
    ]}
  />
  
  {tipoAtribuicao === 'individual' && (
    <MontadoresIndividuais 
      valorRepasse={valorRepasseMontagem}
      onChange={handleMontadoresChange}
    />
  )}
  
  {tipoAtribuicao === 'equipe' && (
    <EquipeSelector 
      valorRepasse={valorRepasseMontagem}
      onChange={handleEquipeChange}
    />
  )}
</Card>
```

**Componente: `MontadoresIndividuais`**

```jsx
function MontadoresIndividuais({ valorRepasse, onChange }) {
  const [montadores, setMontadores] = useState([
    { usuario_id: null, percentual: 100, papel: 'principal' }
  ]);
  
  const calcularValores = () => {
    return montadores.map(m => ({
      ...m,
      valor_atribuido: (valorRepasse * m.percentual) / 100
    }));
  };
  
  const adicionarMontador = () => {
    setMontadores([...montadores, {
      usuario_id: null,
      percentual: 0,
      papel: 'auxiliar'
    }]);
  };
  
  useEffect(() => {
    onChange(calcularValores());
  }, [montadores, valorRepasse]);
  
  return (
    <>
      {montadores.map((montador, index) => (
        <Row key={index}>
          <Col span={10}>
            <Select
              placeholder="Selecione o montador"
              value={montador.usuario_id}
              onChange={(v) => updateMontador(index, 'usuario_id', v)}
              options={usuariosDisponiveis}
            />
          </Col>
          <Col span={5}>
            <Select
              value={montador.papel}
              onChange={(v) => updateMontador(index, 'papel', v)}
              options={[
                { value: 'principal', label: 'Principal' },
                { value: 'auxiliar', label: 'Auxiliar' }
              ]}
            />
          </Col>
          <Col span={5}>
            <InputNumber
              suffix="%"
              value={montador.percentual}
              onChange={(v) => updateMontador(index, 'percentual', v)}
              min={0}
              max={100}
            />
          </Col>
          <Col span={4}>
            <Text strong>R$ {montador.valor_atribuido?.toFixed(2)}</Text>
          </Col>
        </Row>
      ))}
      
      <Button onClick={adicionarMontador} icon={<PlusOutlined />}>
        Adicionar Montador
      </Button>
      
      <Alert 
        type={percentualTotal === 100 ? 'success' : 'warning'}
        message={`Total: ${percentualTotal}%`}
      />
    </>
  );
}
```

**Componente: `EquipeSelector`**

```jsx
function EquipeSelector({ valorRepasse, onChange }) {
  const [equipeSelecionada, setEquipeSelecionada] = useState(null);
  const [membros, setMembros] = useState([]);
  
  const loadMembrosEquipe = async (equipeId) => {
    const { data } = await api.get(`/equipe_membros?equipe_id=${equipeId}`);
    setMembros(data);
  };
  
  const calcularDivisao = () => {
    if (!membros.length) return [];
    
    const valorPorMembro = valorRepasse / membros.length;
    
    return membros.map(membro => ({
      usuario_id: membro.usuario_id,
      valor_atribuido: valorPorMembro,
      percentual_divisao: 100 / membros.length,
      papel: 'equipe'
    }));
  };
  
  useEffect(() => {
    if (equipeSelecionada) {
      loadMembrosEquipe(equipeSelecionada);
    }
  }, [equipeSelecionada]);
  
  useEffect(() => {
    onChange(calcularDivisao());
  }, [membros, valorRepasse]);
  
  return (
    <>
      <FormField
        label="Selecione a Equipe"
        name="equipe_id"
        type="select"
        options={equipesDisponiveis}
        onChange={setEquipeSelecionada}
      />
      
      {membros.length > 0 && (
        <Alert type="info" message="Divisão Automática">
          <Table
            dataSource={calcularDivisao()}
            columns={[
              {
                title: 'Montador',
                dataIndex: 'usuario_id',
                render: (id) => membros.find(m => m.usuario_id === id)?.usuario.nome
              },
              {
                title: 'Percentual',
                dataIndex: 'percentual_divisao',
                render: (v) => `${v.toFixed(2)}%`
              },
              {
                title: 'Valor',
                dataIndex: 'valor_atribuido',
                render: (v) => `R$ ${v.toFixed(2)}`
              }
            ]}
            pagination={false}
          />
        </Alert>
      )}
    </>
  );
}
```

**Salvar Serviço com Montadores:**

```javascript
const salvarServico = async () => {
  // 1. Criar o serviço
  const { data: servico } = await api.post('/servicos', {
    data_servico: form.data_servico,
    tipo_cliente: form.tipo_cliente,
    loja_id: form.loja_id,
    endereco_execucao: form.endereco_execucao,
    valor_total: form.valor_total,
    valor_repasse_montagem: form.valor_repasse_montagem,
    // ... outros campos
  });
  
  // 2. Atribuir montadores
  for (const montador of montadoresData) {
    await api.post('/servico_montadores', {
      servico_id: servico.id,
      usuario_id: montador.usuario_id,
      equipe_id: montador.equipe_id,
      valor_atribuido: montador.valor_atribuido,
      percentual_divisao: montador.percentual_divisao,
      papel: montador.papel
    });
  }
  
  message.success('Serviço criado com sucesso!');
};
```

---

### 4. Dashboard Financeiro - Card "Salários"

**Localização:** Dashboard → Seção Financeira

**Novo Card:**

```jsx
<Card 
  title="💰 Salários dos Montadores"
  extra={<DateRangePicker onChange={handlePeriodoChange} />}
>
  <Row gutter={16}>
    <Col span={8}>
      <Statistic
        title="Total em Salários"
        value={salariosDados?.totais.total_salarios}
        prefix="R$"
        precision={2}
      />
    </Col>
    <Col span={8}>
      <Statistic
        title="Total de Montagens"
        value={salariosDados?.totais.total_valor_montagens}
        prefix="R$"
        precision={2}
      />
    </Col>
    <Col span={8}>
      <Statistic
        title="Serviços Realizados"
        value={salariosDados?.totais.total_servicos}
      />
    </Col>
  </Row>
  
  <Divider />
  
  <Table
    dataSource={salariosDados?.montadores || []}
    columns={[
      {
        title: 'Montador',
        dataIndex: 'nome',
        key: 'nome',
        render: (nome, record) => (
          <Space>
            <Avatar icon={<UserOutlined />} />
            <Text strong>{nome}</Text>
          </Space>
        )
      },
      {
        title: 'Serviços',
        dataIndex: 'servicos_realizados',
        key: 'servicos',
        sorter: (a, b) => a.servicos_realizados - b.servicos_realizados
      },
      {
        title: 'Valor Montagens',
        dataIndex: 'valor_montagens',
        key: 'valor',
        render: (v) => `R$ ${v.toFixed(2)}`,
        sorter: (a, b) => a.valor_montagens - b.valor_montagens
      },
      {
        title: 'Salário Calculado',
        dataIndex: 'salario_calculado',
        key: 'salario',
        render: (v) => (
          <Text strong type="success">R$ {v.toFixed(2)}</Text>
        ),
        sorter: (a, b) => a.salario_calculado - b.salario_calculado
      },
      {
        title: 'Ações',
        key: 'acoes',
        render: (_, record) => (
          <Button 
            size="small" 
            onClick={() => verDetalhes(record)}
          >
            Ver Detalhes
          </Button>
        )
      }
    ]}
    pagination={{ pageSize: 10 }}
  />
  
  <Alert
    type="info"
    message={`Fórmula atual: ${salariosDados?.formula_atual}`}
    action={
      <Button size="small" onClick={() => navigate('/settings')}>
        Alterar Fórmula
      </Button>
    }
  />
</Card>
```

**Modal de Detalhes do Montador:**

```jsx
function ModalDetalhesSalario({ visible, montador, onClose }) {
  return (
    <Modal
      title={`Detalhes - ${montador.nome}`}
      visible={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>Fechar</Button>,
        <Button key="export" type="primary" icon={<DownloadOutlined />}>
          Exportar PDF
        </Button>
      ]}
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Período">
          {montador.periodo_inicio} até {montador.periodo_fim}
        </Descriptions.Item>
        <Descriptions.Item label="Total de Serviços">
          {montador.servicos_realizados}
        </Descriptions.Item>
        <Descriptions.Item label="Valor das Montagens">
          R$ {montador.valor_montagens.toFixed(2)}
        </Descriptions.Item>
        <Descriptions.Item label="Salário Base">
          R$ {montador.valor_base.toFixed(2)}
        </Descriptions.Item>
        <Descriptions.Item label="Fórmula Aplicada" span={2}>
          {montador.formula_aplicada}
        </Descriptions.Item>
        <Descriptions.Item label="Salário Total" span={2}>
          <Text strong type="success" style={{ fontSize: 20 }}>
            R$ {montador.salario_calculado.toFixed(2)}
          </Text>
        </Descriptions.Item>
      </Descriptions>
      
      <Divider>Serviços Realizados</Divider>
      
      <Table
        dataSource={montador.detalhes}
        columns={[
          {
            title: 'Código',
            dataIndex: 'codigo_os_loja',
            key: 'codigo'
          },
          {
            title: 'Data',
            dataIndex: 'data_servico',
            key: 'data',
            render: (date) => moment(date).format('DD/MM/YYYY')
          },
          {
            title: 'Papel',
            dataIndex: 'papel',
            key: 'papel',
            render: (papel) => (
              <Tag color={papel === 'principal' ? 'blue' : 'green'}>
                {papel}
              </Tag>
            )
          },
          {
            title: 'Valor Atribuído',
            dataIndex: 'valor_atribuido',
            key: 'valor',
            render: (v) => `R$ ${v.toFixed(2)}`
          }
        ]}
        pagination={false}
        scroll={{ y: 300 }}
      />
    </Modal>
  );
}
```

**API Call:**

```javascript
const loadSalarios = async (dataInicio, dataFim) => {
  try {
    const params = new URLSearchParams();
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    
    const { data } = await api.get(`/dashboard/salarios?${params}`);
    setSalariosDados(data);
  } catch (error) {
    message.error('Erro ao carregar dados de salários');
  }
};
```

---

## 📊 Fluxo Completo de Uso

### Cenário 1: Cadastro de Loja com Porcentagem

1. Admin acessa **Clientes → Lojas → Nova Loja**
2. Preenche dados básicos
3. Ativa o switch "Porcentagem do móvel"
4. Define porcentagem (ex: 5%)
5. Salva a loja

### Cenário 2: Criação de Serviço para Loja

1. Admin acessa **Serviços → Novo Serviço**
2. Seleciona a loja parceira
3. Adiciona produtos (ex: Guarda-roupa R$ 1.500,00)
4. Sistema calcula automaticamente: 
   - `valor_repasse_montagem = 1500 * 0.05 = R$ 75,00`
5. Seleciona montadores:
   - Carlos (Principal - 70%) → R$ 52,50
   - João (Auxiliar - 30%) → R$ 22,50
6. Salva o serviço

### Cenário 3: Consulta de Salários

1. Admin acessa **Dashboard**
2. Visualiza card "Salários dos Montadores"
3. Vê listagem com todos os montadores e seus salários
4. Clica em "Ver Detalhes" de um montador
5. Visualiza todos os serviços realizados e cálculos

### Cenário 4: Alteração da Fórmula de Salário

1. Admin acessa **Settings**
2. Altera fórmula de "valor_montagem" para "valor_montagem * 1.15"
3. Salva configuração
4. Retorna ao Dashboard
5. Salários são recalculados com 15% de acréscimo

---

## 🧮 Exemplos de Cálculo

### Exemplo 1: Montador Individual sem Fórmula

```
Serviço 1: R$ 500,00 (100%)
Serviço 2: R$ 300,00 (100%)
Serviço 3: R$ 450,00 (100%)

Total Montagens: R$ 1.250,00
Fórmula: valor_montagem
Salário: R$ 1.250,00
```

### Exemplo 2: Montador com Fórmula +15%

```
Total Montagens: R$ 1.250,00
Fórmula: valor_montagem * 1.15
Salário: R$ 1.437,50
```

### Exemplo 3: Divisão em Equipe (3 membros)

```
Serviço: R$ 600,00
Equipe: 3 montadores

Divisão automática:
- Montador A: R$ 200,00 (33.33%)
- Montador B: R$ 200,00 (33.33%)
- Montador C: R$ 200,00 (33.33%)
```

### Exemplo 4: Loja com Porcentagem

```
Produto: Guarda-roupa R$ 2.000,00
Porcentagem da loja: 6%

Valor repasse: R$ 2.000,00 * 0.06 = R$ 120,00

Montadores:
- Principal (60%): R$ 72,00
- Auxiliar (40%): R$ 48,00
```

---

## ✅ Checklist de Implementação Frontend

### Telas a Criar/Modificar:

- [ ] **Settings (Nova)**
  - [ ] Seção de configuração de salários
  - [ ] Campo para fórmula de cálculo
  - [ ] Campo para salário base
  - [ ] Botão de salvar

- [ ] **Dashboard (Atualização)**
  - [ ] Novo card "Salários dos Montadores"
  - [ ] Tabela com listagem de montadores
  - [ ] Estatísticas de salários
  - [ ] Modal de detalhes por montador
  - [ ] Filtro de período

- [ ] **Lojas (Atualização)**
  - [ ] Campo "Usa Porcentagem" (switch)
  - [ ] Campo "Porcentagem de Repasse"
  - [ ] Campo "Observações de Pagamento"
  - [ ] Validação condicional

- [ ] **Serviços (Atualização)**
  - [ ] Campo "Valor de Repasse para Montagem" (calculado)
  - [ ] Seletor de tipo de atribuição (individual/equipe)
  - [ ] Componente de montadores individuais com %
  - [ ] Componente de seleção de equipe
  - [ ] Cálculo automático de divisão
  - [ ] Validação de 100%

### Componentes Reutilizáveis:

- [ ] `MontadoresIndividuais.jsx`
- [ ] `EquipeSelector.jsx`
- [ ] `SalariosCard.jsx`
- [ ] `ModalDetalhesSalario.jsx`
- [ ] `FormulaConfigurator.jsx`

### Services/APIs:

- [ ] `configuracaoService.js` - CRUD de configurações
- [ ] `servicoMontadorService.js` - Gestão de montadores por serviço
- [ ] `dashboardService.js` - Adicionar endpoint de salários

---

## 🚀 Próximos Passos

1. ✅ Executar o script SQL de migração do banco
2. ✅ Reiniciar o backend para carregar novos modelos
3. 🔄 Implementar os componentes do frontend
4. 🔄 Testar fluxo completo
5. 🔄 Validar cálculos
6. 🔄 Deploy em produção

---

**Documentação criada em:** 13/02/2026  
**Versão:** 2.0
