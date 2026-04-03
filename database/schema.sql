-- =====================================================
-- EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USUARIOS
-- =====================================================

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE,
    senha_hash TEXT,
    tipo VARCHAR(20) CHECK (tipo IN ('admin','montador')),
    percentual_salario NUMERIC(5,2) DEFAULT 50,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP
);

CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);

-- =====================================================
-- CONFIGURACOES DO SISTEMA
-- =====================================================

CREATE TABLE configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descricao TEXT,
    tipo VARCHAR(50), -- 'texto', 'numero', 'percentual', 'formula'
    updated_at TIMESTAMP DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO configuracoes (chave, valor, descricao, tipo) VALUES
('salario_formula', 'valor_montagem', 'Fórmula para cálculo de salário: valor_montagem, valor_montagem * 1.1, etc', 'formula'),
('salario_base_padrao', '0', 'Valor base adicional ao salário (além das montagens)', 'numero');

-- =====================================================
-- EQUIPES
-- =====================================================

CREATE TABLE equipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- EQUIPE_MEMBROS
-- =====================================================

CREATE TABLE equipe_membros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipe_id UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE (equipe_id, usuario_id)
);

CREATE INDEX idx_equipe_membros_equipe ON equipe_membros(equipe_id);
CREATE INDEX idx_equipe_membros_usuario ON equipe_membros(usuario_id);

-- =====================================================
-- LOJAS
-- =====================================================

CREATE TABLE lojas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    cnpj VARCHAR(18),
    razao_social VARCHAR(150),
    nome_fantasia VARCHAR(150),
    telefone VARCHAR(20),
    email VARCHAR(120),
    endereco TEXT,
    prazo_pagamento_dias INT,
    
    -- Configuração de cálculo de repasse
    usa_porcentagem BOOLEAN DEFAULT false,
    porcentagem_repasse NUMERIC(5,2), -- Ex: 5.00 para 5%
    observacoes_pagamento TEXT,
    
    created_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- CLIENTES PARTICULARES
-- =====================================================

CREATE TABLE clientes_particulares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(20),
    endereco TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- PRODUTOS
-- =====================================================

CREATE TABLE produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    valor_base NUMERIC(10,2),
    tempo_base_min INT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now()
);

CREATE UNIQUE INDEX idx_produtos_loja_nome ON produtos(loja_id, nome);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);

-- =====================================================
-- SERVICOS
-- =====================================================

CREATE TABLE servicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_os_loja VARCHAR(50),
    data_servico DATE NOT NULL,

    tipo_cliente VARCHAR(20) 
        CHECK (tipo_cliente IN ('loja','particular')),

    loja_id UUID REFERENCES lojas(id),
    cliente_particular_id UUID REFERENCES clientes_particulares(id),

    endereco_execucao TEXT NOT NULL,

    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),

    prioridade INT DEFAULT 0,

    janela_inicio TIME,
    janela_fim TIME,

    valor_total NUMERIC(10,2),
    valor_repasse_montagem NUMERIC(10,2), -- Valor que será distribuído aos montadores

    status VARCHAR(20)
        CHECK (status IN ('agendado','em_rota','concluido','cancelado')),

    observacoes TEXT,

    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP,

    CHECK (
        (tipo_cliente = 'loja' AND loja_id IS NOT NULL AND cliente_particular_id IS NULL)
        OR
        (tipo_cliente = 'particular' AND cliente_particular_id IS NOT NULL AND loja_id IS NULL)
    )
);

CREATE INDEX idx_servicos_data ON servicos(data_servico);
CREATE INDEX idx_servicos_status ON servicos(status);
CREATE INDEX idx_servicos_loja ON servicos(loja_id);

-- =====================================================
-- SERVICO_PRODUTOS
-- =====================================================

CREATE TABLE servico_produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES produtos(id),
    quantidade INT NOT NULL,
    valor_unitario NUMERIC(10,2),
    utilizar_desconto BOOLEAN DEFAULT FALSE,
    valor_desconto NUMERIC(10,2) DEFAULT 0,
    valor_total NUMERIC(10,2)
);

CREATE INDEX idx_servico_produtos_servico ON servico_produtos(servico_id);

-- =====================================================
-- SERVICO_EXTRAS
-- =====================================================

CREATE TABLE servico_extras (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    descricao  VARCHAR(200) NOT NULL,
    valor      NUMERIC(10,2) NOT NULL DEFAULT 0,
    observacao TEXT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_servico_extras_servico ON servico_extras(servico_id);

-- =====================================================
-- SERVICO_MONTADORES
-- =====================================================

CREATE TABLE servico_montadores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    
    -- Pode ser montador individual OU equipe
    usuario_id UUID REFERENCES usuarios(id),
    equipe_id UUID REFERENCES equipes(id),
    
    -- Valor atribuído a este montador/equipe
    valor_atribuido NUMERIC(10,2) NOT NULL,
    percentual_divisao NUMERIC(5,2), -- Percentual dentro do serviço (ex: 70% principal, 30% auxiliar)
    
    papel VARCHAR(20) CHECK (papel IN ('principal','auxiliar')),
    
    created_at TIMESTAMP DEFAULT now(),
    
    CHECK (
        usuario_id IS NOT NULL
        OR
        equipe_id IS NOT NULL
    )
);

CREATE INDEX idx_servico_montadores_servico ON servico_montadores(servico_id);
CREATE INDEX idx_servico_montadores_usuario ON servico_montadores(usuario_id);
CREATE INDEX idx_servico_montadores_equipe ON servico_montadores(equipe_id);

-- =====================================================
-- ROTAS
-- =====================================================

CREATE TABLE rotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data DATE NOT NULL,
    equipe_id UUID NOT NULL REFERENCES equipes(id),

    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,

    status VARCHAR(20)
        CHECK (status IN ('planejada','em_andamento','finalizada')),

    km_total NUMERIC(8,2),
    tempo_total_min INT,

    created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_rotas_data ON rotas(data);
CREATE INDEX idx_rotas_equipe ON rotas(equipe_id);

-- =====================================================
-- ROTA_SERVICOS
-- =====================================================

CREATE TABLE rota_servicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rota_id UUID NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
    servico_id UUID NOT NULL REFERENCES servicos(id),

    ordem INT NOT NULL,

    horario_previsto_chegada TIME,
    horario_previsto_saida TIME,

    tempo_deslocamento_min INT,
    tempo_montagem_calculado_min INT,

    UNIQUE (rota_id, servico_id)
);

CREATE INDEX idx_rota_servicos_rota ON rota_servicos(rota_id);
CREATE INDEX idx_rota_servicos_ordem ON rota_servicos(rota_id, ordem);

-- =====================================================
-- RECEBIMENTOS
-- =====================================================

CREATE TABLE recebimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    valor NUMERIC(10,2) NOT NULL,
    data_prevista DATE,
    data_recebimento DATE,
    status VARCHAR(20)
        CHECK (status IN ('pendente','recebido')),
    forma_pagamento VARCHAR(30)
);

CREATE INDEX idx_recebimentos_status ON recebimentos(status);
CREATE INDEX idx_recebimentos_data_prevista ON recebimentos(data_prevista);

-- =====================================================
-- PAGAMENTOS FUNCIONARIOS
-- =====================================================

CREATE TABLE pagamentos_funcionarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    valor NUMERIC(10,2) NOT NULL,
    valor_pago NUMERIC(10,2) DEFAULT 0,
    categoria VARCHAR(30) DEFAULT 'salario',
    origem VARCHAR(30) DEFAULT 'servico',
    data_vencimento DATE,
    data_pagamento DATE,
    observacoes TEXT,
    responsavel_id UUID REFERENCES usuarios(id),
    status VARCHAR(20)
);

CREATE INDEX idx_pagamentos_usuario ON pagamentos_funcionarios(usuario_id);
CREATE INDEX idx_pagamentos_status ON pagamentos_funcionarios(status);
CREATE INDEX idx_pagamentos_data_vencimento ON pagamentos_funcionarios(data_vencimento);
CREATE INDEX idx_pagamentos_responsavel ON pagamentos_funcionarios(responsavel_id);

CREATE TABLE pagamentos_funcionarios_baixas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pagamento_funcionario_id UUID NOT NULL REFERENCES pagamentos_funcionarios(id) ON DELETE CASCADE,
    valor NUMERIC(10,2) NOT NULL,
    data_pagamento DATE NOT NULL,
    forma_pagamento VARCHAR(30),
    observacoes TEXT,
    responsavel_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT now(),
    CHECK (valor > 0)
);

CREATE INDEX idx_pagamentos_baixas_pagamento ON pagamentos_funcionarios_baixas(pagamento_funcionario_id);
CREATE INDEX idx_pagamentos_baixas_data ON pagamentos_funcionarios_baixas(data_pagamento);
CREATE INDEX idx_pagamentos_baixas_responsavel ON pagamentos_funcionarios_baixas(responsavel_id);

-- =====================================================
-- DESPESAS
-- =====================================================

CREATE TABLE despesas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descricao TEXT NOT NULL,
    categoria VARCHAR(50),
    valor NUMERIC(10,2) NOT NULL,
    data_despesa DATE NOT NULL,
    responsavel_id UUID REFERENCES usuarios(id),
    servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
    rota_id UUID REFERENCES rotas(id) ON DELETE SET NULL
);

CREATE INDEX idx_despesas_categoria ON despesas(categoria);
CREATE INDEX idx_despesas_data ON despesas(data_despesa);
CREATE INDEX idx_despesas_responsavel ON despesas(responsavel_id);
