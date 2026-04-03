module.exports = (sequelize, DataTypes) => {
  return sequelize.define('ServicoExtra', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    servico_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    descricao: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    observacao: {
      type: DataTypes.TEXT
    },
    created_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'servico_extras',
    timestamps: false
  });
};
