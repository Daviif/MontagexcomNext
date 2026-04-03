
// Tipos do Sistema Montagex (espelhados do backend)

export type StatusOS = 'agendada' | 'em_andamento' | 'concluida' | 'cancelada' | 'pendente';
export type PrioridadeOS = 'baixa' | 'normal' | 'alta' | 'urgente';
export type TipoCliente = 'loja' | 'particular';
export type TipoRepasse = 'percentual' | 'fixo';
export type StatusPagamento = 'pendente' | 'pago' | 'atrasado' | 'parcial';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  tipo: 'admin' | 'montador';
  ativo: boolean;
  avatar?: string;
  criadoEm: Date;
}

export interface Montador extends Usuario {
  tipo: 'montador';
  percentualSalario: number;
  chavePix?: string;
  metaMensal: number;
  equipeId?: string;
}

export interface Equipe {
  id: string;
  nome: string;
  membros: Montador[];
  lider?: Montador;
  ativa: boolean;
}

export interface LojaParceira {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  endereco: Endereco;
  telefone: string;
  email: string;
  tipoRepasse: TipoRepasse;
  valorRepasse: number;
  ativa: boolean;
  divida: number;
  criadoEm: Date;
}

export interface ClienteParticular {
  id: string;
  nome: string;
  cpf: string;
  endereco: Endereco;
  telefone: string;
  email?: string;
  observacoes?: string;
  criadoEm: Date;
}

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  latitude?: number;
  longitude?: number;
}

export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  categoria: string;
  tempoBase: number; // em minutos
  tempoEstimado: number;
  valorBase: number;
  valorMontagem: number;
  lojaId?: string;
  ativo: boolean;
}

export interface OrdemServico {
  id: string;
  numero: string;
  clienteId: string;
  tipoCliente: TipoCliente;
  cliente?: LojaParceira | ClienteParticular;
  enderecoEntrega: Endereco;
  dataAgendada: Date;
  janelaHorario: { inicio: string; fim: string };
  produtos: ItemOS[];
  montadores: Montador[];
  equipeId?: string;
  status: StatusOS;
  prioridade: PrioridadeOS;
  valorTotal: number;
  valorMontagem: number;
  observacoes?: string;
  fotos: string[];
  assinaturaCliente?: string;
  checkInAt?: Date;
  checkOutAt?: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface ItemOS {
  id: string;
  produtoId: string;
  produto?: Produto;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface Salario {
  id: string;
  montadorId: string;
  montador?: Montador;
  mes: number;
  ano: number;
  valorBruto: number;
  valorLiquido: number;
  descontos: number;
  bonus: number;
  status: StatusPagamento;
  dataPagamento?: Date;
  comprovante?: string;
}

export interface Despesa {
  id: string;
  descricao: string;
  categoria: 'combustivel' | 'ferramentas' | 'material' | 'veiculo' | 'outros';
  valor: number;
  data: Date;
  comprovante?: string;
  observacoes?: string;
}

export interface Recebimento {
  id: string;
  ordemServicoId: string;
  ordemServico?: OrdemServico;
  valor: number;
  dataPrevista: Date;
  dataPagamento?: Date;
  status: StatusPagamento;
  comprovante?: string;
}

export interface DashboardData {
  financeiro: {
    receitaTotal: number;
    receitaLojas: number;
    receitaParticulares: number;
    despesasTotal: number;
    lucroLiquido: number;
    pendentes: number;
  };
  operacional: {
    servicosAgendados: number;
    servicosEmAndamento: number;
    servicosConcluidos: number;
    servicosCancelados: number;
    montadoresAtivos: number;
    equipesAtivas: number;
    clientesAtivos: number;
    lojasAtivas: number;
  };
  graficos: {
    receitasPorTipo: { tipo: string; valor: number }[];
    despesasPorCategoria: { categoria: string; valor: number }[];
    servicosPorStatus: { status: string; quantidade: number }[];
    receitaMensal: { mes: string; receita: number; despesa: number }[];
  };
}
