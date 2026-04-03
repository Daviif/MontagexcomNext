module.exports = (sequelize, DataTypes) => {
  const ServicoAnexo = sequelize.define('ServicoAnexo', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    servico_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    nome_arquivo: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    extensao: {
      type: DataTypes.STRING(20)
    },
    tipo_mime: {
      type: DataTypes.STRING(100)
    },
    tamanho_bytes: {
      type: DataTypes.BIGINT
    },
    caminho_arquivo: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    descricao: {
      type: DataTypes.TEXT
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    criado_por: {
      type: DataTypes.UUID
    }
  }, {
    tableName: 'servico_anexos',
    timestamps: false
  });

  return ServicoAnexo;
};
