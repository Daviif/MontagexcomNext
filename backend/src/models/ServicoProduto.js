module.exports = (sequelize, DataTypes) => {
  return sequelize.define('ServicoProduto', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    servico_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    produto_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    valor_unitario: {
      type: DataTypes.DECIMAL(10, 2)
    },
    utilizar_desconto: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    valor_desconto: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    valor_total: {
      type: DataTypes.DECIMAL(10, 2)
    }
  }, {
    tableName: 'servico_produtos',
    timestamps: false
  });
};
