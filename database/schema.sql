-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.clientes_particulares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome character varying NOT NULL,
  telefone character varying,
  endereco text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT clientes_particulares_pkey PRIMARY KEY (id)
);
CREATE TABLE public.configuracoes (
  id integer NOT NULL DEFAULT nextval('configuracoes_id_seq'::regclass),
  chave character varying NOT NULL UNIQUE,
  valor text,
  descricao text,
  tipo character varying,
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT configuracoes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.despesas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  categoria character varying,
  valor numeric NOT NULL,
  data_despesa date NOT NULL,
  responsavel_id uuid,
  servico_id uuid,
  CONSTRAINT despesas_pkey PRIMARY KEY (id),
  CONSTRAINT despesas_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.equipe_membros (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  equipe_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT equipe_membros_pkey PRIMARY KEY (id),
  CONSTRAINT equipe_membros_equipe_id_fkey FOREIGN KEY (equipe_id) REFERENCES public.equipes(id),
  CONSTRAINT equipe_membros_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.equipes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome character varying NOT NULL,
  ativa boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT equipes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.lojas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  telefone character varying,
  email character varying,
  endereco text,
  prazo_pagamento_dias integer,
  usa_porcentagem boolean DEFAULT false,
  porcentagem_repasse numeric,
  observacoes_pagamento text,
  created_at timestamp without time zone DEFAULT now(),
  cnpj character varying,
  razao_social character varying,
  nome_fantasia character varying,
  CONSTRAINT lojas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pagamento_funcionario_anexos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pagamento_funcionario_id uuid NOT NULL,
  nome_arquivo character varying NOT NULL,
  extensao character varying,
  tipo_mime character varying,
  tamanho_bytes bigint,
  caminho_arquivo text NOT NULL,
  descricao text,
  criado_em timestamp without time zone DEFAULT now(),
  criado_por uuid,
  CONSTRAINT pagamento_funcionario_anexos_pkey PRIMARY KEY (id),
  CONSTRAINT pagamento_funcionario_anexos_pagamento_funcionario_id_fkey FOREIGN KEY (pagamento_funcionario_id) REFERENCES public.pagamentos_funcionarios(id),
  CONSTRAINT pagamento_funcionario_anexos_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.usuarios(id)
);
CREATE TABLE public.pagamentos_funcionarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  servico_id uuid NOT NULL,
  valor numeric NOT NULL,
  data_pagamento date,
  status character varying,
  categoria character varying DEFAULT 'salario'::character varying,
  origem character varying DEFAULT 'servico'::character varying,
  valor_pago numeric DEFAULT 0,
  data_vencimento date,
  observacoes text,
  responsavel_id uuid,
  CONSTRAINT pagamentos_funcionarios_pkey PRIMARY KEY (id),
  CONSTRAINT pagamentos_funcionarios_servico_id_fkey FOREIGN KEY (servico_id) REFERENCES public.servicos(id),
  CONSTRAINT pagamentos_funcionarios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
  CONSTRAINT pagamentos_funcionarios_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.pagamentos_funcionarios_baixas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  pagamento_funcionario_id uuid NOT NULL,
  valor numeric NOT NULL CHECK (valor > 0::numeric),
  data_pagamento date NOT NULL,
  forma_pagamento character varying,
  observacoes text,
  responsavel_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT pagamentos_funcionarios_baixas_pkey PRIMARY KEY (id),
  CONSTRAINT pagamentos_funcionarios_baixas_pagamento_funcionario_id_fkey FOREIGN KEY (pagamento_funcionario_id) REFERENCES public.pagamentos_funcionarios(id),
  CONSTRAINT pagamentos_funcionarios_baixas_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.produtos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome character varying NOT NULL,
  valor_base numeric,
  tempo_base_min integer NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  loja_id uuid,
  categoria character varying,
  codigo integer NOT NULL DEFAULT nextval('produtos_codigo_seq'::regclass),
  CONSTRAINT produtos_pkey PRIMARY KEY (id),
  CONSTRAINT produtos_loja_id_fkey FOREIGN KEY (loja_id) REFERENCES public.lojas(id)
);
CREATE TABLE public.recebimentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  servico_id uuid NOT NULL,
  valor numeric NOT NULL,
  data_prevista date,
  data_recebimento date,
  status character varying CHECK (status::text = ANY (ARRAY['pendente'::character varying::text, 'recebido'::character varying::text])),
  forma_pagamento character varying,
  observacoes text,
  CONSTRAINT recebimentos_pkey PRIMARY KEY (id),
  CONSTRAINT recebimentos_servico_id_fkey FOREIGN KEY (servico_id) REFERENCES public.servicos(id)
);
CREATE TABLE public.rota_servicos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rota_id uuid NOT NULL,
  servico_id uuid NOT NULL,
  ordem integer NOT NULL,
  horario_previsto_chegada time without time zone,
  horario_previsto_saida time without time zone,
  tempo_deslocamento_min integer,
  tempo_montagem_calculado_min integer,
  CONSTRAINT rota_servicos_pkey PRIMARY KEY (id),
  CONSTRAINT rota_servicos_rota_id_fkey FOREIGN KEY (rota_id) REFERENCES public.rotas(id),
  CONSTRAINT rota_servicos_servico_id_fkey FOREIGN KEY (servico_id) REFERENCES public.servicos(id)
);
CREATE TABLE public.rotas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  data date NOT NULL,
  equipe_id uuid,
  horario_inicio time without time zone NOT NULL,
  horario_fim time without time zone NOT NULL,
  status character varying CHECK (status::text = ANY (ARRAY['planejada'::character varying::text, 'em_andamento'::character varying::text, 'finalizada'::character varying::text])),
  km_total numeric,
  tempo_total_min integer,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT rotas_pkey PRIMARY KEY (id),
  CONSTRAINT rotas_equipe_id_fkey FOREIGN KEY (equipe_id) REFERENCES public.equipes(id)
);
CREATE TABLE public.servico_anexos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  servico_id uuid NOT NULL,
  nome_arquivo character varying NOT NULL,
  extensao character varying,
  tipo_mime character varying,
  tamanho_bytes bigint,
  caminho_arquivo text NOT NULL,
  descricao text,
  criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  criado_por uuid,
  CONSTRAINT servico_anexos_pkey PRIMARY KEY (id),
  CONSTRAINT servico_anexos_servico_id_fkey FOREIGN KEY (servico_id) REFERENCES public.servicos(id),
  CONSTRAINT fk_servico_anexos_usuario FOREIGN KEY (criado_por) REFERENCES public.usuarios(id)
);
CREATE TABLE public.servico_extras (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  servico_id uuid NOT NULL,
  descricao character varying NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  observacao text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT servico_extras_pkey PRIMARY KEY (id),
  CONSTRAINT servico_extras_servico_id_fkey FOREIGN KEY (servico_id) REFERENCES public.servicos(id)
);
CREATE TABLE public.servico_montadores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  servico_id uuid NOT NULL,
  usuario_id uuid,
  equipe_id uuid,
  valor_atribuido numeric NOT NULL,
  percentual_divisao numeric,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT servico_montadores_pkey PRIMARY KEY (id),
  CONSTRAINT servico_montadores_equipe_id_fkey FOREIGN KEY (equipe_id) REFERENCES public.equipes(id),
  CONSTRAINT servico_montadores_servico_id_fkey FOREIGN KEY (servico_id) REFERENCES public.servicos(id),
  CONSTRAINT servico_montadores_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.servico_produtos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  servico_id uuid NOT NULL,
  produto_id uuid NOT NULL,
  quantidade integer NOT NULL,
  valor_unitario numeric,
  valor_total numeric,
  utilizar_desconto boolean DEFAULT false,
  valor_desconto numeric DEFAULT 0,
  CONSTRAINT servico_produtos_pkey PRIMARY KEY (id),
  CONSTRAINT servico_produtos_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES public.produtos(id),
  CONSTRAINT servico_produtos_servico_id_fkey FOREIGN KEY (servico_id) REFERENCES public.servicos(id)
);
CREATE TABLE public.servicos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  data_servico date NOT NULL,
  tipo_cliente character varying CHECK (tipo_cliente::text = ANY (ARRAY['loja'::character varying::text, 'particular'::character varying::text])),
  loja_id uuid,
  cliente_particular_id uuid,
  endereco_execucao text NOT NULL,
  latitude numeric,
  longitude numeric,
  prioridade character varying DEFAULT 0,
  janela_inicio time without time zone,
  janela_fim time without time zone,
  valor_total numeric,
  valor_repasse_montagem numeric,
  status character varying CHECK (status::text = ANY (ARRAY['agendada'::character varying, 'agendado'::character varying, 'em_rota'::character varying, 'concluido'::character varying, 'cancelado'::character varying]::text[])),
  observacoes text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone,
  cliente_final_nome text,
  cliente_final_contato character varying,
  codigo_os_loja character varying,
  CONSTRAINT servicos_pkey PRIMARY KEY (id),
  CONSTRAINT servicos_cliente_particular_id_fkey FOREIGN KEY (cliente_particular_id) REFERENCES public.clientes_particulares(id),
  CONSTRAINT servicos_loja_id_fkey FOREIGN KEY (loja_id) REFERENCES public.lojas(id)
);
CREATE TABLE public.usuarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome character varying NOT NULL,
  email character varying UNIQUE,
  senha_hash text,
  tipo character varying CHECK (tipo::text = ANY (ARRAY['admin'::character varying::text, 'montador'::character varying::text])),
  ativo boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone,
  foto_perfil text,
  chave_pix text,
  data_nascimento date,
  habilitacao text,
  meta_mensal numeric,
  percentual_salario numeric DEFAULT 50,
  Telefone character varying,
  CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);