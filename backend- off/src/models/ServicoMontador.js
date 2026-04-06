module.exports = (sequelize, DataTypes) => {
  const ServicoMontador = sequelize.define('ServicoMontador', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    servico_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    usuario_id: {
      type: DataTypes.UUID
    },
    equipe_id: {
      type: DataTypes.UUID
    },
    valor_atribuido: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    percentual_divisao: {
      type: DataTypes.DECIMAL(5, 2)
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'servico_montadores',
    timestamps: false,
    hooks: {
      // Hook após CREATE: recalcula todos os montadores do serviço (divisão mudou)
      afterCreate: async (montador, options) => {
        const { recalcularValoresMontadores } = require('../utils/recalculos');
        const models = require('./index').models;
        
        const servico = await models.Servico.findByPk(montador.servico_id);
        if (servico) {
          const valorRepasse = Number(servico.valor_repasse_montagem || 0);
          await recalcularValoresMontadores(servico.id, valorRepasse, models);
        }
      },
      
      // Hook após DELETE: recalcula montadores restantes
      afterDestroy: async (montador, options) => {
        const { recalcularValoresMontadores } = require('../utils/recalculos');
        const models = require('./index').models;
        
        const servico = await models.Servico.findByPk(montador.servico_id);
        if (servico) {
          const valorRepasse = Number(servico.valor_repasse_montagem || 0);
          await recalcularValoresMontadores(servico.id, valorRepasse, models);
        }
      },
      
      // Hook após UPDATE: recalcula se percentual_divisao mudou
      afterUpdate: async (montador, options) => {
        const { recalcularValoresMontadores } = require('../utils/recalculos');
        const models = require('./index').models;
        
        const changed = montador.changed();
        if (changed && changed.includes('percentual_divisao')) {
          const servico = await models.Servico.findByPk(montador.servico_id);
          if (servico) {
            const valorRepasse = Number(servico.valor_repasse_montagem || 0);
            await recalcularValoresMontadores(servico.id, valorRepasse, models);
          }
        }
      }
    }
  });

  return ServicoMontador;
};
