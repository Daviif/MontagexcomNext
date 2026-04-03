module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Configuracao', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    chave: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    valor: {
      type: DataTypes.TEXT
    },
    descricao: {
      type: DataTypes.TEXT
    },
    tipo: {
      type: DataTypes.STRING(50) // 'texto', 'numero', 'percentual', 'formula'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'configuracoes',
    timestamps: false
  });
};
