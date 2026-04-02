module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Produto', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nome: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    loja_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    valor_base: {
      type: DataTypes.DECIMAL(10, 2)
    },
    tempo_base_min: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    categoria: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    codigo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
    primaryKey: true,
    }
  }, {
    tableName: 'produtos',
    timestamps: false
  });
};
