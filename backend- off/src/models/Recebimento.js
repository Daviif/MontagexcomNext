module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Recebimento', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    servico_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    data_prevista: {
      type: DataTypes.DATEONLY
    },
    data_recebimento: {
      type: DataTypes.DATEONLY
    },
    status: {
      type: DataTypes.STRING(20)
    },
    forma_pagamento: {
      type: DataTypes.STRING(30)
    },
    observacoes: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'recebimentos',
    timestamps: false
  });
};
