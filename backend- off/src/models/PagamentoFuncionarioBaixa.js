module.exports = (sequelize, DataTypes) => {
  return sequelize.define('PagamentoFuncionarioBaixa', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    pagamento_funcionario_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    data_pagamento: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    forma_pagamento: {
      type: DataTypes.STRING(30)
    },
    observacoes: {
      type: DataTypes.TEXT
    },
    responsavel_id: {
      type: DataTypes.UUID
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'pagamentos_funcionarios_baixas',
    timestamps: false
  });
};