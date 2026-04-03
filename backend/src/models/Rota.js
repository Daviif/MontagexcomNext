module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Rota', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    data: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    equipe_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    horario_inicio: {
      type: DataTypes.TIME,
      allowNull: false
    },
    horario_fim: {
      type: DataTypes.TIME,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20)
    },
    km_total: {
      type: DataTypes.DECIMAL(8, 2)
    },
    tempo_total_min: {
      type: DataTypes.INTEGER
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'rotas',
    timestamps: false
  });
};
