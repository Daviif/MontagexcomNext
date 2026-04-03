module.exports = (sequelize, DataTypes) => {
  return sequelize.define('EquipeMembro', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    equipe_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    usuario_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'equipe_membros',
    timestamps: false
  });
};
