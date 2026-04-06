E o banco dessa forma:
-- =========================
-- EXTENSÕES
-- =========================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- TABELA CENTRAL (PESSOAS)
-- =========================
CREATE TABLE pessoas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_pessoa VARCHAR(20) NOT NULL,
    nome_razao_social VARCHAR(255) NOT NULL,
    apelido_fantasia VARCHAR(255),
    documento VARCHAR(20) UNIQUE,
    email VARCHAR(255),
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP DEFAULT NULL,  -- soft delete
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_tipo_pessoa
        CHECK (tipo_pessoa IN ('USUARIO','LOJA','CLIENTE_FINAL'))
);

-- =========================
-- ENDEREÇOS (NORMALIZADO)
-- =========================
CREATE TABLE enderecos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pessoa_id UUID NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
    rua VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(50),
    cep VARCHAR(20),
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    deleted_at TIMESTAMP DEFAULT NULL,  -- soft delete
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_endereco_pessoa ON enderecos(pessoa_id);
CREATE INDEX idx_endereco_cidade ON enderecos(cidade);

-- =========================
-- COLABORADORES
-- Constraint garante que apenas pessoas do tipo USUARIO
-- podem ter registro nesta tabela (via trigger abaixo)
-- =========================
CREATE TABLE colaboradores_info (
    pessoa_id UUID PRIMARY KEY REFERENCES pessoas(id) ON DELETE CASCADE,
    tipo_colaborador VARCHAR(20),
    senha_hash TEXT NOT NULL,
    chave_pix VARCHAR(100),
    comissao_padrao NUMERIC(5,2) DEFAULT 50.00,
    meta_mensal NUMERIC(12,2) DEFAULT 0,

    CONSTRAINT check_tipo_colaborador
        CHECK (tipo_colaborador IN ('ADMIN','MONTADOR')),
    CONSTRAINT check_comissao_range
        CHECK (comissao_padrao BETWEEN 0 AND 100)
);

-- Trigger: impede que LOJA ou CLIENTE_FINAL virem colaboradores
CREATE OR REPLACE FUNCTION fn_valida_tipo_colaborador()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT tipo_pessoa FROM pessoas WHERE id = NEW.pessoa_id) <> 'USUARIO' THEN
        RAISE EXCEPTION 'Apenas pessoas do tipo USUARIO podem ser colaboradores.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_valida_tipo_colaborador
    BEFORE INSERT OR UPDATE ON colaboradores_info
    FOR EACH ROW EXECUTE FUNCTION fn_valida_tipo_colaborador();

-- =========================
-- PRODUTOS
-- =========================
CREATE TABLE produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loja_id UUID NOT NULL REFERENCES pessoas(id),
    sku_externo VARCHAR(50),
    nome VARCHAR(255) NOT NULL,
    valor_montagem_base NUMERIC(12,2) NOT NULL CHECK (valor_montagem_base >= 0),
    tempo_estimado_minutos INTEGER DEFAULT 60 CHECK (tempo_estimado_minutos > 0),
    deleted_at TIMESTAMP DEFAULT NULL,  -- soft delete
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(loja_id, sku_externo)
);

CREATE INDEX idx_produto_loja ON produtos(loja_id);

-- Trigger: impede que um não-LOJA seja referenciado como loja_id
CREATE OR REPLACE FUNCTION fn_valida_loja_produto()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT tipo_pessoa FROM pessoas WHERE id = NEW.loja_id) <> 'LOJA' THEN
        RAISE EXCEPTION 'O campo loja_id deve referenciar uma pessoa do tipo LOJA.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_valida_loja_produto
    BEFORE INSERT OR UPDATE ON produtos
    FOR EACH ROW EXECUTE FUNCTION fn_valida_loja_produto();

-- =========================
-- ORDENS DE SERVIÇO
-- =========================
CREATE TABLE ordens_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_rastreio VARCHAR(20) UNIQUE NOT NULL DEFAULT 'OS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6)),

    loja_origem_id UUID REFERENCES pessoas(id),
    cliente_destino_id UUID NOT NULL REFERENCES pessoas(id),

    -- Snapshot do endereço no momento da criação da OS
    endereco_execucao_id UUID REFERENCES enderecos(id),

    status_fluxo VARCHAR(30) DEFAULT 'RASCUNHO',
    data_programada TIMESTAMP,

    valor_venda_total NUMERIC(12,2) DEFAULT 0 CHECK (valor_venda_total >= 0),
    valor_custo_montagem NUMERIC(12,2) DEFAULT 0 CHECK (valor_custo_montagem >= 0),

    observacoes TEXT,

    deleted_at TIMESTAMP DEFAULT NULL,  -- soft delete
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_status_fluxo
        CHECK (status_fluxo IN (
            'RASCUNHO',
            'AGENDADO',
            'EM_DESLOCAMENTO',
            'EXECUCAO',
            'CONCLUIDO',
            'CANCELADO'
        ))
);

CREATE INDEX idx_os_cliente ON ordens_servico(cliente_destino_id);
CREATE INDEX idx_os_status ON ordens_servico(status_fluxo);
CREATE INDEX idx_os_loja ON ordens_servico(loja_origem_id);

-- Trigger: garante que loja_origem_id seja do tipo LOJA
CREATE OR REPLACE FUNCTION fn_valida_loja_os()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.loja_origem_id IS NOT NULL THEN
        IF (SELECT tipo_pessoa FROM pessoas WHERE id = NEW.loja_origem_id) <> 'LOJA' THEN
            RAISE EXCEPTION 'loja_origem_id deve referenciar uma pessoa do tipo LOJA.';
        END IF;
    END IF;

    -- Garante que o cliente destino seja do tipo CLIENTE_FINAL
    IF (SELECT tipo_pessoa FROM pessoas WHERE id = NEW.cliente_destino_id) <> 'CLIENTE_FINAL' THEN
        RAISE EXCEPTION 'cliente_destino_id deve referenciar uma pessoa do tipo CLIENTE_FINAL.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_valida_loja_os
    BEFORE INSERT OR UPDATE ON ordens_servico
    FOR EACH ROW EXECUTE FUNCTION fn_valida_loja_os();

-- =========================
-- HISTÓRICO DE STATUS DA OS
-- Registra toda transição de status com quem alterou e quando
-- =========================
CREATE TABLE os_historico_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    status_anterior VARCHAR(30),
    status_novo VARCHAR(30) NOT NULL,
    alterado_por UUID REFERENCES pessoas(id),
    alterado_em TIMESTAMP DEFAULT NOW(),
    observacao TEXT
);

CREATE INDEX idx_historico_os ON os_historico_status(os_id);
CREATE INDEX idx_historico_data ON os_historico_status(alterado_em);

-- Trigger: grava automaticamente o histórico a cada mudança de status
CREATE OR REPLACE FUNCTION fn_registra_historico_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.status_fluxo IS DISTINCT FROM NEW.status_fluxo) THEN
        INSERT INTO os_historico_status (os_id, status_anterior, status_novo)
        VALUES (
            NEW.id,
            CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status_fluxo END,
            NEW.status_fluxo
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_historico_status_os
    AFTER INSERT OR UPDATE ON ordens_servico
    FOR EACH ROW EXECUTE FUNCTION fn_registra_historico_status();

-- =========================
-- ITENS DA OS
-- =========================
CREATE TABLE os_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id),
    descricao_manual TEXT,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    valor_unitario_na_data NUMERIC(12,2) NOT NULL CHECK (valor_unitario_na_data >= 0),

    -- Pelo menos um dos dois deve estar preenchido
    CONSTRAINT check_produto_ou_descricao
        CHECK (produto_id IS NOT NULL OR descricao_manual IS NOT NULL)
);

CREATE INDEX idx_itens_os ON os_itens(os_id);

-- =========================
-- EXECUTORES
-- =========================
CREATE TABLE os_executores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    colaborador_id UUID NOT NULL REFERENCES pessoas(id),
    percentual_participacao NUMERIC(5,2) DEFAULT 100.00,
    valor_comissao_final NUMERIC(12,2),
    eh_responsavel BOOLEAN DEFAULT FALSE,

    CONSTRAINT check_percentual_range
        CHECK (percentual_participacao BETWEEN 0 AND 100),

    UNIQUE(os_id, colaborador_id)
);

CREATE INDEX idx_exec_os ON os_executores(os_id);

-- Trigger: impede que um não-USUARIO (colaborador) seja executor
CREATE OR REPLACE FUNCTION fn_valida_executor_colaborador()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT tipo_pessoa FROM pessoas WHERE id = NEW.colaborador_id) <> 'USUARIO' THEN
        RAISE EXCEPTION 'Apenas pessoas do tipo USUARIO podem ser executores de uma OS.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_valida_executor_colaborador
    BEFORE INSERT OR UPDATE ON os_executores
    FOR EACH ROW EXECUTE FUNCTION fn_valida_executor_colaborador();

-- =========================
-- FINANCEIRO (TRANSAÇÕES)
-- =========================
CREATE TABLE financeiro_transacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID REFERENCES ordens_servico(id),
    pessoa_id UUID NOT NULL REFERENCES pessoas(id),

    tipo_transacao VARCHAR(10),
    categoria VARCHAR(50),
    descricao TEXT,  -- campo livre para descrever a transação

    valor_total NUMERIC(12,2) NOT NULL CHECK (valor_total > 0),
    data_vencimento DATE NOT NULL,

    status_pagamento VARCHAR(20) DEFAULT 'ABERTO',

    deleted_at TIMESTAMP DEFAULT NULL,  -- soft delete
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_tipo_transacao
        CHECK (tipo_transacao IN ('ENTRADA','SAIDA')),

    CONSTRAINT check_status_pagamento
        CHECK (status_pagamento IN ('ABERTO','PARCIAL','LIQUIDADO','CANCELADO'))
);

CREATE INDEX idx_financeiro_pessoa ON financeiro_transacoes(pessoa_id);
CREATE INDEX idx_financeiro_status ON financeiro_transacoes(status_pagamento);
CREATE INDEX idx_financeiro_os ON financeiro_transacoes(os_id);
CREATE INDEX idx_financeiro_vencimento ON financeiro_transacoes(data_vencimento);

-- =========================
-- BAIXAS (PAGAMENTOS)
-- =========================
CREATE TABLE financeiro_baixas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transacao_id UUID NOT NULL REFERENCES financeiro_transacoes(id) ON DELETE CASCADE,
    valor_pago NUMERIC(12,2) NOT NULL CHECK (valor_pago > 0),
    data_pagamento TIMESTAMP DEFAULT NOW(),
    meio_pagamento VARCHAR(50),
    comprovante_url TEXT,
    observacao TEXT
);

CREATE INDEX idx_baixa_transacao ON financeiro_baixas(transacao_id);

-- Trigger: atualiza status_pagamento da transação após cada baixa
CREATE OR REPLACE FUNCTION fn_atualiza_status_transacao()
RETURNS TRIGGER AS $$
DECLARE
    v_total NUMERIC(12,2);
	v_pago NUMERIC(12,2);
	v_transacao_id UUID;
BEGIN
	IF TG_OP = 'DELETE' THEN
		v_transacao_id := OLD.transacao_id;
	ELSE
		v_transacao_id := NEW.transacao_id;
	END IF;

    SELECT valor_total INTO v_total
    FROM financeiro_transacoes
	WHERE id = v_transacao_id;

    SELECT COALESCE(SUM(valor_pago), 0) INTO v_pago
    FROM financeiro_baixas
	WHERE transacao_id = v_transacao_id;

    UPDATE financeiro_transacoes
    SET status_pagamento = CASE
        WHEN v_pago <= 0       THEN 'ABERTO'
        WHEN v_pago >= v_total THEN 'LIQUIDADO'
        ELSE 'PARCIAL'
    END
	WHERE id = v_transacao_id;

	IF TG_OP = 'DELETE' THEN
		RETURN OLD;
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atualiza_status_transacao
    AFTER INSERT OR DELETE ON financeiro_baixas
    FOR EACH ROW EXECUTE FUNCTION fn_atualiza_status_transacao();

-- =========================
-- updated_at AUTOMÁTICO
-- Aplica a todas as tabelas com coluna updated_at
-- =========================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pessoas_updated_at
    BEFORE UPDATE ON pessoas
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_os_updated_at
    BEFORE UPDATE ON ordens_servico
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();