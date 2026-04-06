module.exports = (sequelize, DataTypes) => {
  return sequelize.define('ClienteParticular', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nome: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    telefone: {
      type: DataTypes.STRING(20)
    },
    endereco: {
      type: DataTypes.TEXT
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'clientes_particulares',
    timestamps: false
  });
};
