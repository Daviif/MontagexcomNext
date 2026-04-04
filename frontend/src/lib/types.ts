// Montador para leaderboard do dashboard
export interface TopMontador {
  id: string
  nome: string
  foto_perfil?: string | null
  qtd_servicos: number
  valor_total: number
}

// Tipos do Sistema Montagex
export type StatusOS = 'agendada' | 'em_andamento' | 'concluido' | 'cancelada' | 'pendente'
export type PrioridadeOS = 'baixa' | 'normal' | 'alta' | 'urgente'
export type TipoCliente = 'loja' | 'particular'
export type TipoRepasse = 'percentual' | 'fixo'
export type StatusPagamento = 'pendente' | 'pago' | 'atrasado' | 'parcial'

export interface clientes_particulares {
  id: string
  nome: string
  telefone: string
  endereco: Endereco
  created_at: Date
}
export interface despesa {
  id: string
  descricao: string
  categoria: 'combustivel' | 'ferramentas' | 'material' | 'veiculo' | 'outros'
  valor: number
  data_despesa: Date
  responsavel_id: string
}
export interface equipe_membros {
  id: string
  equipe_id: string
  usuario_id: string
  created_at: Date
}
export interface equipes {
  id: string
  nome: string
  ativa: boolean
}
export interface lojas {
  id: string
  telefone: string
  email: string
  endereco: Endereco
  prazo_pagamento_dias: number
  usa_percentual: boolean
  porcentagem_repasse: number
  observacoes_pagamento?: string
  created_at: Date
  cnpj: string
  razao_social: string
  nome_fantasia: string
  divida: number
}
export interface pagamento_funcionario_anexos {
  id: string
  pagamento_funcionario_id: string
  nome_arquivo: string
  extensao: string
  tipo_mime: string
  tamanho_bytes: number
  caminho_arquivo: string
  descricao: string
  criado_em: Date
  criado_por: string
}
export interface pagamentos_funcionarios {
  id: string
  usuario_id: string
  servico_id: string
  valor: number
  data_pagamento: Date
  status: string
  categoria: string
  origem: string
  valor_pago: number
  data_vencimento: Date
  observacoes: string
  responsavel_id: string
}
export interface pagamentos_funcionarios_baixas {
  id: string
  pagamento_funcionario_id: string
  servico_id: string
  valor: number
  data_pagamento: Date
  forma_pagamento: string
  observacoes: string
  responsavel_id: string
  criado_em: Date
}
export interface Produto {
  id: string
  nome: string
  valor_base: number
  tempo_base_min: number
  ativo: boolean
  created_at: Date
  lojaId?: string
  categoria: string
  codigo: number
}
export interface Recebimento {
  id: string
  servico_id: string
  valor: number
  data_prevista: Date
  data_recebimento?: Date
  status: StatusPagamento
  forma_pagamento: string
  observacoes: string
  ordemServico?: OrdemServico
}
export interface Usuario {
  id: string
  nome: string
  email: string
  tipo: 'admin' | 'montador'
  ativo: boolean
  avatar?: string
  created_at: Date
  atualizadoEm: Date
  foto_perfil?: string | null
  chave_pix?: string | null
  data_nascimento?: Date
  habilitacao?: string
  percentual_salario?: number
  Telefone: number
}
export interface Montador extends Usuario {
  tipo: 'montador'
  meta_mensal: number
  equipeId?: string
}
export interface Endereco {
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  latitude?: number
  longitude?: number
}
export interface OrdemServico {
  id: string
  data_servico: Date
  tipo_cliente: TipoCliente
  loja_id: string
  cliente_particular_id: string
  endereco_execucao: Endereco | string
  latitude?: number
  longitude?: number
  prioridade: PrioridadeOS
  janela_inicio: string
  janela_fim: string
  valor_total: number
  valor_total_repasse: number
  status: StatusOS
  observacoes?: string
  criadoEm: Date
  atualizadoEm: Date
  cliente_final_nome: string
  cliente_final_contato: string
  clienteId: string
  codigo_os_loja: string
  Loja?: lojas | null
  ClienteParticular?: clientes_particulares | null
  produtos: ItemOS[]
  montadores: Montador[]
  equipeId?: string
  fotos: string[]
  assinaturaCliente?: string
  checkInAt?: Date
  checkOutAt?: Date
  servico_montadores?: servico_montadores[]
  ServicoProdutos?: servico_produtos[]
  janelaHorario?: {
    inicio?: string
    fim?: string
  }
}
export interface servico_produtos{
  id: string
  servico_id: string
  produto_id: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  utilizar_desconto: boolean
  valor_desconto: number
}
export interface servico_montadores{
  id: string
  servico_id: string
  usuario: Usuario
  equipe_id: string
  valor_atribuido: number
  percentual_divisao: number
  criado_em: Date
}
export interface ItemOS {
  id: string
  produtoId: string
  produto?: Produto
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

export interface Salario {
  id: string
  montadorId: string
  montador?: Montador
  mes: number
  ano: number
  valorBruto: number
  valorLiquido: number
  descontos: number
  bonus: number
  status: StatusPagamento
  dataPagamento?: Date
  comprovante?: string
}

export interface DashboardData {
  financeiro: {
    receitaTotal: number
    receitaLojas: number
    receitaParticulares: number
    despesasTotal: number
    lucroLiquido: number
    pendentes: number
    margemLucro: number
  }
  operacional: {
    servicosAgendados: number
    servicosEmAndamento: number
    servicosConcluidos: number
    servicosCancelados: number
    montadoresAtivos: number
    equipesAtivas: number
    clientesAtivos: number
    lojasAtivas: number
  }
  graficos: {
    receitasPorTipo: { name: string; value: number }[]
    despesasPorCategoria: { categoria: string; valor: number }[]
    servicosPorStatus: { status: string; quantidade: number }[]
    receitaMensal: { mes: string; receita: number; despesa: number }[]
  }
  periodo: {
    inicio: string;
    fim: string;
  };
}

export interface DetalheServico {
  servico_id: string;
  codigo_os_loja?: string;
  data_servico: string;
  valor_cheio: number;
  valor_calculado: number;
  valor_atribuido: number;
  percentual_divisao: number;
  equipe_id: string | null;
  _debug?: unknown; // Para o modo debug
}

export interface MontadorCalculado {
  usuario_id: string;
  id: string;
  nome: string;
  percentual_salario: number;
  servicos_realizados: number;
  valor_montagens: number;
  valor_base: number;
  salario_calculado: number;
  detalhes: DetalheServico[];
}

export interface DashboardSalariosResponse {
  periodo: {
    inicio: string;
    fim: string;
  };
  formula_atual: string;
  montadores: MontadorCalculado[];
  totais: {
    total_montadores: number;
    total_servicos: number;
    total_valor_montagens: number;
    total_salarios: number;
  };

}

export interface GraficoItem {
  name?: string
  tipo_cliente?: string
  categoria?: string
  valor?: number
  value?: number
  mes?: string
  receita?: number
  despesas?: number
  despesa?: number
}

export interface pagamentos_funcionarios_baixas {
  id: string
  pagamento_funcionario_id: string
  valor: number
  data_pagamento: Date
  forma_pagamento: string
  observacoes: string
  responsavel_id: string
  created_at: Date
}