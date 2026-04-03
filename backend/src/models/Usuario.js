module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Usuario', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nome: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(120),
      unique: true
    },
    senha_hash: {
      type: DataTypes.TEXT
    },
    tipo: {
      type: DataTypes.STRING(20)
    },
    foto_perfil: {
      type: DataTypes.TEXT
    },
    chave_pix: {
      type: DataTypes.TEXT
    },
    data_nascimento: {
      type: DataTypes.DATEONLY
    },
    habilitacao: {
      type: DataTypes.TEXT
    },
    meta_mensal: {
      type: DataTypes.DECIMAL(10, 2)
    },
    percentual_salario: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 50
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE
    },
    Telefone: {
      type: DataTypes.STRING(20)
    }
  }, {
    tableName: 'usuarios',
    timestamps: false,
    hooks: {
      // Quando percentual_salario muda, recalcula valor_atribuido de todos os serviços do montador
      afterUpdate: async (usuario, options) => {
        const changed = usuario.changed();
        if (!changed || !changed.includes('percentual_salario')) return;

        const { recalcularValoresMontadores } = require('../utils/recalculos');
        const models = require('./index').models;

        const atribuicoes = await models.ServicoMontador.findAll({
          where: { usuario_id: usuario.id },
          attributes: ['servico_id']
        });

        const servicoIds = [...new Set(atribuicoes.map((a) => a.servico_id))];

        for (const servicoId of servicoIds) {
          const servico = await models.Servico.findByPk(servicoId, { attributes: ['id', 'valor_repasse_montagem'] });
          if (servico) {
            await recalcularValoresMontadores(servico.id, Number(servico.valor_repasse_montagem || 0), models);
          }
        }
      }
    }
  });
};
