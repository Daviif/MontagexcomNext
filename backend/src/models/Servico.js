module.exports = (sequelize, DataTypes) => {
  const Servico = sequelize.define('Servico', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    codigo_os_loja: {
      type: DataTypes.STRING(50)
    },
    data_servico: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    tipo_cliente: {
      type: DataTypes.STRING(20)
    },
    loja_id: {
      type: DataTypes.UUID
    },
    cliente_particular_id: {
      type: DataTypes.UUID
    },
    endereco_execucao: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    latitude: {
      type: DataTypes.DECIMAL(9, 6)
    },
    longitude: {
      type: DataTypes.DECIMAL(9, 6)
    },
    prioridade: {
      type: DataTypes.STRING(20),
      defaultValue: 'normal'
    },
    janela_inicio: {
      type: DataTypes.TIME
    },
    janela_fim: {
      type: DataTypes.TIME
    },
    valor_total: {
      type: DataTypes.DECIMAL(10, 2)
    },
    valor_repasse_montagem: {
      type: DataTypes.DECIMAL(10, 2)
    },
    status: {
      type: DataTypes.STRING(20)
    },
    observacoes: {
      type: DataTypes.TEXT
    },
    cliente_final_nome: {
      type: DataTypes.TEXT
    },
    cliente_final_contato: {
      type: DataTypes.STRING(50)
    },
    codigo_os_loja: {
      type: DataTypes.STRING(50)
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'servicos',
    timestamps: false,
    hooks: {
      // Hook após UPDATE: recalcula montadores se valor_repasse_montagem ou valor_total mudou
      afterUpdate: async (servico, options) => {
        const { recalcularValoresMontadores } = require('../utils/recalculos');
        const models = require('./index').models;
        
        // Verificar se valor_repasse_montagem ou valor_total mudou
        const changed = servico.changed();
        if (changed && (changed.includes('valor_repasse_montagem') || changed.includes('valor_total'))) {
          const valorRepasse = Number(servico.valor_repasse_montagem || 0);
          await recalcularValoresMontadores(servico.id, valorRepasse, models);
        }
      }
    }
  });

  return Servico;
};
