module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Despesa', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    categoria: {
      type: DataTypes.STRING(50)
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    responsavel_id: {
      type: DataTypes.UUID
    },
    data_despesa: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    servico_id: {
      type: DataTypes.UUID
    },
  }, {
    tableName: 'despesas',
    timestamps: false
  });
};
