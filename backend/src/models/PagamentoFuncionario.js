module.exports = (sequelize, DataTypes) => {
  return sequelize.define('PagamentoFuncionario', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    usuario_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    servico_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    valor_pago: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    categoria: {
      type: DataTypes.STRING(30),
      defaultValue: 'salario'
    },
    origem: {
      type: DataTypes.STRING(30),
      defaultValue: 'servico'
    },
    data_vencimento: {
      type: DataTypes.DATEONLY
    },
    data_pagamento: {
      type: DataTypes.DATEONLY
    },
    observacoes: {
      type: DataTypes.TEXT
    },
    responsavel_id: {
      type: DataTypes.UUID
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pendente'
    }
  }, {
    tableName: 'pagamentos_funcionarios',
    timestamps: false
  });
};
