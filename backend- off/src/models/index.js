const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Usuario = require('./Usuario')(sequelize, Sequelize.DataTypes);
const Equipe = require('./Equipe')(sequelize, Sequelize.DataTypes);
const EquipeMembro = require('./EquipeMembro')(sequelize, Sequelize.DataTypes);
const Loja = require('./Loja')(sequelize, Sequelize.DataTypes);
const ClienteParticular = require('./ClienteParticular')(sequelize, Sequelize.DataTypes);
const Produto = require('./Produto')(sequelize, Sequelize.DataTypes);
const Servico = require('./Servico')(sequelize, Sequelize.DataTypes);
const ServicoProduto = require('./ServicoProduto')(sequelize, Sequelize.DataTypes);
const ServicoMontador = require('./ServicoMontador')(sequelize, Sequelize.DataTypes);
const ServicoAnexo = require('./ServicoAnexo')(sequelize, Sequelize.DataTypes);
const ServicoExtra = require('./ServicoExtra')(sequelize, Sequelize.DataTypes);
const Rota = require('./Rota')(sequelize, Sequelize.DataTypes);
const RotaServico = require('./RotaServico')(sequelize, Sequelize.DataTypes);
const Recebimento = require('./Recebimento')(sequelize, Sequelize.DataTypes);
const PagamentoFuncionario = require('./PagamentoFuncionario')(sequelize, Sequelize.DataTypes);
const Despesa = require('./Despesa')(sequelize, Sequelize.DataTypes);
const Configuracao = require('./Configuracao')(sequelize, Sequelize.DataTypes);
const PagamentoFuncionarioBaixa = require('./PagamentoFuncionarioBaixa')(sequelize, Sequelize.DataTypes);
const PagamentoFuncionarioAnexo = require('./PagamentoFuncionarioAnexo')(sequelize, Sequelize.DataTypes);

Equipe.hasMany(EquipeMembro, { foreignKey: 'equipe_id' });
EquipeMembro.belongsTo(Equipe, { foreignKey: 'equipe_id' });

Usuario.hasMany(EquipeMembro, { foreignKey: 'usuario_id' });
EquipeMembro.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Loja.hasMany(Servico, { foreignKey: 'loja_id' });
ClienteParticular.hasMany(Servico, { foreignKey: 'cliente_particular_id' });
Servico.belongsTo(Loja, { foreignKey: 'loja_id', as: 'Loja' });
Servico.belongsTo(ClienteParticular, { foreignKey: 'cliente_particular_id', as: 'ClienteParticular' });

Loja.hasMany(Produto, { foreignKey: 'loja_id' });
Produto.belongsTo(Loja, { foreignKey: 'loja_id' });

Servico.hasMany(ServicoProduto, { foreignKey: 'servico_id' });
Produto.hasMany(ServicoProduto, { foreignKey: 'produto_id' });
ServicoProduto.belongsTo(Servico, { foreignKey: 'servico_id' });
ServicoProduto.belongsTo(Produto, { foreignKey: 'produto_id' });

Servico.hasMany(ServicoMontador, { foreignKey: 'servico_id', as: 'montadores' });
ServicoMontador.belongsTo(Servico, { foreignKey: 'servico_id' });
ServicoMontador.belongsTo(Usuario, { foreignKey: 'usuario_id' });
ServicoMontador.belongsTo(Equipe, { foreignKey: 'equipe_id' });
Usuario.hasMany(ServicoMontador, { foreignKey: 'usuario_id' });
Equipe.hasMany(ServicoMontador, { foreignKey: 'equipe_id' });

Servico.hasMany(ServicoAnexo, { foreignKey: 'servico_id' });
ServicoAnexo.belongsTo(Servico, { foreignKey: 'servico_id' });
ServicoAnexo.belongsTo(Usuario, { foreignKey: 'criado_por', as: 'criador' });
Usuario.hasMany(ServicoAnexo, { foreignKey: 'criado_por' });

Servico.hasMany(ServicoExtra, { foreignKey: 'servico_id' });
ServicoExtra.belongsTo(Servico, { foreignKey: 'servico_id' });

Equipe.hasMany(Rota, { foreignKey: 'equipe_id' });
Rota.belongsTo(Equipe, { foreignKey: 'equipe_id' });

Rota.hasMany(RotaServico, { foreignKey: 'rota_id' });
Servico.hasMany(RotaServico, { foreignKey: 'servico_id' });
RotaServico.belongsTo(Rota, { foreignKey: 'rota_id' });
RotaServico.belongsTo(Servico, { foreignKey: 'servico_id' });

Servico.hasMany(Recebimento, { foreignKey: 'servico_id' });
Recebimento.belongsTo(Servico, { foreignKey: 'servico_id' });

Usuario.hasMany(PagamentoFuncionario, { foreignKey: 'usuario_id' });
Servico.hasMany(PagamentoFuncionario, { foreignKey: 'servico_id' });
PagamentoFuncionario.belongsTo(Usuario, { foreignKey: 'usuario_id' });
PagamentoFuncionario.belongsTo(Servico, { foreignKey: 'servico_id' });

PagamentoFuncionario.hasMany(PagamentoFuncionarioBaixa, { foreignKey: 'pagamento_funcionario_id', as: 'baixas' });
PagamentoFuncionarioBaixa.belongsTo(PagamentoFuncionario, { foreignKey: 'pagamento_funcionario_id' });
Usuario.hasMany(PagamentoFuncionarioBaixa, { foreignKey: 'responsavel_id' });
PagamentoFuncionarioBaixa.belongsTo(Usuario, { foreignKey: 'responsavel_id', as: 'responsavel' });

PagamentoFuncionario.hasMany(PagamentoFuncionarioAnexo, { foreignKey: 'pagamento_funcionario_id', as: 'anexos' });
PagamentoFuncionarioAnexo.belongsTo(PagamentoFuncionario, { foreignKey: 'pagamento_funcionario_id' });
PagamentoFuncionarioAnexo.belongsTo(Usuario, { foreignKey: 'criado_por', as: 'criador' });

Usuario.hasMany(PagamentoFuncionario, { foreignKey: 'responsavel_id', as: 'pagamentos_lancados' });
PagamentoFuncionario.belongsTo(Usuario, { foreignKey: 'responsavel_id', as: 'responsavel' });

Usuario.hasMany(Despesa, { foreignKey: 'responsavel_id' });
Despesa.belongsTo(Usuario, { foreignKey: 'responsavel_id', as: 'responsavel' });

Servico.hasMany(Despesa, { foreignKey: 'servico_id' });
Despesa.belongsTo(Servico, { foreignKey: 'servico_id' });

module.exports = {
  sequelize,
  Sequelize,
  models: {
    Usuario,
    Equipe,
    EquipeMembro,
    Loja,
    ClienteParticular,
    Produto,
    Servico,
    ServicoProduto,
    ServicoMontador,
    ServicoAnexo,
    ServicoExtra,
    Rota,
    RotaServico,
    Recebimento,
    PagamentoFuncionario,
    Despesa,
    Configuracao,
    PagamentoFuncionarioBaixa,
    PagamentoFuncionarioAnexo
  }
};
