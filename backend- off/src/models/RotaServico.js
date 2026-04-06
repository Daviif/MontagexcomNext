module.exports = (sequelize, DataTypes) => {
  return sequelize.define('RotaServico', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    rota_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    servico_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    ordem: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    horario_previsto_chegada: {
      type: DataTypes.TIME
    },
    horario_previsto_saida: {
      type: DataTypes.TIME
    },
    tempo_deslocamento_min: {
      type: DataTypes.INTEGER
    },
    tempo_montagem_calculado_min: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'rota_servicos',
    timestamps: false
  });
};
