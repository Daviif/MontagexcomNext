const express = require('express');
const router = express.Router();
const { models, sequelize } = require('../models');
const { Op } = require('sequelize');

const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const getMonthRange = (baseDate) => {
  const inicio = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const fim = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  return { inicio, fim };
};

const sumField = async (model, field, where) => {
  const result = await model.findAll({
    attributes: [[sequelize.fn('SUM', sequelize.col(field)), 'total']],
    where,
    raw: true
  });

  return parseFloat(result?.[0]?.total || 0);
};

const getMontadorServicoIds = async (usuarioId) => {
  const membros = await models.EquipeMembro.findAll({
    where: { usuario_id: usuarioId },
    attributes: ['equipe_id'],
    raw: true
  });

  const equipeIds = membros
    .map((membro) => membro.equipe_id)
    .filter(Boolean);

  const where = {
    [Op.or]: [
      { usuario_id: usuarioId },
      ...(equipeIds.length > 0 ? [{ equipe_id: { [Op.in]: equipeIds } }] : [])
    ]
  };

  const atribuicoes = await models.ServicoMontador.findAll({
    where,
    attributes: ['servico_id'],
    raw: true
  });

  return [...new Set(atribuicoes.map((item) => item.servico_id))];
};

/**
 * GET /api/v1/dashboard
 *
 * Retorna dados consolidados do dashboard (financeiro, serviços, equipe e gráficos)
 */
router.get('/', async (req, res) => {
  try {
    const hoje = new Date();
    const { inicio: inicioMes, fim: fimMes } = getMonthRange(hoje);

    const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const { inicio: inicioMesAnterior, fim: fimMesAnterior } = getMonthRange(mesAnterior);

    const isMontador = req.user?.tipo === 'montador';

    if (isMontador) {
      const usuarioId = req.user.id;
      const servicoIds = await getMontadorServicoIds(usuarioId);

      const totalRecebido = await sumField(models.PagamentoFuncionario, 'valor', {
        usuario_id: usuarioId,
        status: 'pago',
        data_pagamento: { [Op.between]: [inicioMes, fimMes] }
      });

      const totalRecebidoMesAnterior = await sumField(models.PagamentoFuncionario, 'valor', {
        usuario_id: usuarioId,
        status: 'pago',
        data_pagamento: { [Op.between]: [inicioMesAnterior, fimMesAnterior] }
      });

      const totalDespesas = await sumField(models.Despesa, 'valor', {
        responsavel_id: usuarioId,
        data_despesa: { [Op.between]: [inicioMes, fimMes] }
      });

      const totalPendente = await sumField(models.PagamentoFuncionario, 'valor', {
        usuario_id: usuarioId,
        status: 'pendente'
      });

      const totalParcialPrevisto = await sumField(models.PagamentoFuncionario, 'valor', {
        usuario_id: usuarioId,
        status: 'parcial'
      });

      const totalParcialPago = await sumField(models.PagamentoFuncionario, 'valor_pago', {
        usuario_id: usuarioId,
        status: 'parcial'
      });

      const pendenteParcial = Math.max(totalParcialPrevisto - totalParcialPago, 0);
      const pendenteTotal = totalPendente + pendenteParcial;

      const lucro = totalRecebido - totalDespesas;
      const margemLucro = totalRecebido > 0 ? (lucro / totalRecebido) * 100 : 0;
      const variacaoMes = totalRecebidoMesAnterior > 0
        ? ((totalRecebido - totalRecebidoMesAnterior) / totalRecebidoMesAnterior) * 100
        : 0;

      const servicoWhereBase = servicoIds.length > 0
        ? { id: { [Op.in]: servicoIds } }
        : { id: { [Op.in]: [] } };

      const servicosRealizados = await models.Servico.count({
        where: {
          ...servicoWhereBase,
          status: 'concluido',
          data_servico: { [Op.between]: [inicioMes, fimMes] }
        }
      });

      const servicosAgendados = await models.Servico.count({
        where: {
          ...servicoWhereBase,
          status: 'agendado',
          data_servico: { [Op.between]: [inicioMes, fimMes] }
        }
      });

      const servicosTotal = await models.Servico.count({
        where: {
          ...servicoWhereBase,
          data_servico: { [Op.between]: [inicioMes, fimMes] }
        }
      });

      const taxaConclusao = servicosTotal > 0 ? (servicosRealizados / servicosTotal) * 100 : 0;

      let receitasMap = { loja: 0, particular: 0 };
      if (servicoIds.length > 0) {
        const receitasPorTipo = await models.Servico.findAll({
          attributes: [
            'tipo_cliente',
            [sequelize.fn('SUM', sequelize.col('valor_repasse_montagem')), 'total']
          ],
          where: {
            id: { [Op.in]: servicoIds },
            status: 'concluido',
            data_servico: { [Op.between]: [inicioMes, fimMes] }
          },
          group: ['tipo_cliente'],
          raw: true
        });

        receitasMap = receitasPorTipo.reduce((acc, row) => {
          acc[row.tipo_cliente] = parseFloat(row.total || 0);
          return acc;
        }, { loja: 0, particular: 0 });
      }

      const receitasData = [
        { name: 'Lojas', value: receitasMap.loja || 0 },
        { name: 'Particulares', value: receitasMap.particular || 0 }
      ];

      const despesasMensais = [];
      for (let i = 5; i >= 0; i -= 1) {
        const refDate = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const { inicio, fim } = getMonthRange(refDate);
        const totalMes = await sumField(models.Despesa, 'valor', {
          responsavel_id: usuarioId,
          data_despesa: { [Op.between]: [inicio, fim] }
        });

        despesasMensais.push({
          name: monthLabels[refDate.getMonth()],
          despesas: parseFloat(totalMes.toFixed(2))
        });
      }

      return res.json({
        success: true,
        data: {
          periodo: {
            mes: monthLabels[hoje.getMonth()],
            ano: hoje.getFullYear()
          },
          financeiro: {
            total_recebido: parseFloat(totalRecebido.toFixed(2)),
            total_despesas: parseFloat(totalDespesas.toFixed(2)),
            lucro: parseFloat(lucro.toFixed(2)),
            pendente: parseFloat(pendenteTotal.toFixed(2)),
            margem_lucro: parseFloat(margemLucro.toFixed(2)),
            variacao_mes: parseFloat(variacaoMes.toFixed(2))
          },
          servicos: {
            realizados: servicosRealizados,
            agendados: servicosAgendados,
            taxa_conclusao: parseFloat(taxaConclusao.toFixed(2))
          },
          equipe: {
            montadores_ativos: 1,
            total_montadores: 1
          },
          graficos: {
            receitas_por_tipo: receitasData,
            despesas_mensais: despesasMensais
          }
        }
      });
    }

    const totalRecebido = await sumField(models.Recebimento, 'valor', {
      status: 'recebido',
      data_recebimento: { [Op.between]: [inicioMes, fimMes] }
    });

    const totalRecebidoMesAnterior = await sumField(models.Recebimento, 'valor', {
      status: 'recebido',
      data_recebimento: { [Op.between]: [inicioMesAnterior, fimMesAnterior] }
    });

    const totalDespesas = await sumField(models.Despesa, 'valor', {
      data_despesa: { [Op.between]: [inicioMes, fimMes] }
    });

    const totalPendente = await sumField(models.Recebimento, 'valor', {
      status: 'pendente',
      data_prevista: { [Op.between]: [inicioMes, fimMes] }
    });

    const lucro = totalRecebido - totalDespesas;
    const margemLucro = totalRecebido > 0 ? (lucro / totalRecebido) * 100 : 0;
    const variacaoMes = totalRecebidoMesAnterior > 0
      ? ((totalRecebido - totalRecebidoMesAnterior) / totalRecebidoMesAnterior) * 100
      : 0;

    const servicosRealizados = await models.Servico.count({
      where: {
        status: 'concluido',
        data_servico: { [Op.between]: [inicioMes, fimMes] }
      }
    });

    const servicosAgendados = await models.Servico.count({
      where: {
        status: 'agendado',
        data_servico: { [Op.between]: [inicioMes, fimMes] }
      }
    });

    const servicosTotal = await models.Servico.count({
      where: {
        data_servico: { [Op.between]: [inicioMes, fimMes] }
      }
    });

    const taxaConclusao = servicosTotal > 0 ? (servicosRealizados / servicosTotal) * 100 : 0;

    const montadorFiltro = {
      [Op.or]: [
        { tipo: 'montador' },
        { tipo: { [Op.is]: null } },
        { tipo: '' }
      ],
      [Op.not]: { tipo: 'admin' }
    };


    const montadoresAtivos = await models.Usuario.count({
      where: { ...montadorFiltro, ativo: true }
    });

    const totalMontadores = await models.Usuario.count({
      where: montadorFiltro
    });

    // Contar todos os clientes particulares (não existe coluna 'ativo')
    const clientesAtivos = await models.ClienteParticular.count();

    // Contar todas as lojas (não existe coluna 'ativa')
    const lojasAtivas = await models.Loja.count();

    const receitasPorTipo = await models.Recebimento.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('valor')), 'total'],
        [sequelize.col('Servico.tipo_cliente'), 'tipo_cliente']
      ],
      include: [{
        model: models.Servico,
        attributes: [],
        required: true
      }],
      where: {
        status: 'recebido',
        data_recebimento: { [Op.between]: [inicioMes, fimMes] }
      },
      group: ['Servico.tipo_cliente'],
      raw: true
    });

    const receitasMap = receitasPorTipo.reduce((acc, row) => {
      acc[row.tipo_cliente] = parseFloat(row.total || 0);
      return acc;
    }, {});

    const receitasData = [
      { name: 'Lojas', value: receitasMap.loja || 0 },
      { name: 'Particulares', value: receitasMap.particular || 0 }
    ];

    const despesasMensais = [];
    for (let i = 5; i >= 0; i -= 1) {
      const refDate = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const { inicio, fim } = getMonthRange(refDate);
      const totalMes = await sumField(models.Despesa, 'valor', {
        data_despesa: { [Op.between]: [inicio, fim] }
      });

      despesasMensais.push({
        name: monthLabels[refDate.getMonth()],
        despesas: parseFloat(totalMes.toFixed(2))
      });
    }

    // Despesas por categoria (no mês atual)
    const despesasPorCategoriaRaw = await models.Despesa.findAll({
      attributes: [
        'categoria',
        [sequelize.fn('SUM', sequelize.col('valor')), 'total']
      ],
      where: {
        data_despesa: { [Op.between]: [inicioMes, fimMes] }
      },
      group: ['categoria'],
      raw: true
    });

    const despesasPorCategoria = despesasPorCategoriaRaw.map(item => ({
      categoria: item.categoria || 'Outros',
      valor: parseFloat(item.total || 0)
    }));

    // Top Montadores do mês (por quantidade de serviços e valor atribuído)
    // Busca todos os montadores que participaram de serviços no mês
    const topMontadoresRaw = await models.ServicoMontador.findAll({
      attributes: [
        'usuario_id',
        [sequelize.fn('COUNT', sequelize.col('ServicoMontador.id')), 'qtd_servicos'],
        [sequelize.fn('SUM', sequelize.col('valor_atribuido')), 'valor_total']
      ],
      include: [
        {
          model: models.Servico,
          attributes: [],
          required: true,
          where: {
            data_servico: { [Op.between]: [inicioMes, fimMes] },
            status: 'concluido'
          }
        }
      ],
      group: ['usuario_id'],
      order: [[sequelize.literal('valor_total'), 'DESC']],
      limit: 5,
      raw: true
    });

    // Busca dados dos usuários (nome, foto)
    const usuarioIds = topMontadoresRaw.map(m => m.usuario_id);
    let usuariosMap = {};
    if (usuarioIds.length > 0) {
      const usuarios = await models.Usuario.findAll({
        where: { id: { [Op.in]: usuarioIds } },
        attributes: ['id', 'nome', 'foto_perfil'],
        raw: true
      });
      usuariosMap = usuarios.reduce((acc, u) => { acc[u.id] = u; return acc; }, {});
    }

    const topMontadores = topMontadoresRaw.map(m => ({
      id: m.usuario_id,
      nome: usuariosMap[m.usuario_id]?.nome || 'Desconhecido',
      foto_perfil: usuariosMap[m.usuario_id]?.foto_perfil || null,
      qtd_servicos: Number(m.qtd_servicos) || 0,
      valor_total: Number(m.valor_total) || 0
    }));

    res.json({
      success: true,
      data: {
        periodo: {
          mes: monthLabels[hoje.getMonth()],
          ano: hoje.getFullYear()
        },
        financeiro: {
          total_recebido: parseFloat(totalRecebido.toFixed(2)),
          total_despesas: parseFloat(totalDespesas.toFixed(2)),
          lucro: parseFloat(lucro.toFixed(2)),
          pendente: parseFloat(totalPendente.toFixed(2)),
          margem_lucro: parseFloat(margemLucro.toFixed(2)),
          variacao_mes: parseFloat(variacaoMes.toFixed(2))
        },
        servicos: {
          realizados: servicosRealizados,
          agendados: servicosAgendados,
          taxa_conclusao: parseFloat(taxaConclusao.toFixed(2))
        },
        equipe: {
          montadores_ativos: montadoresAtivos,
          total_montadores: totalMontadores,
          clientes_ativos: clientesAtivos,
          lojas_ativas: lojasAtivas
        },
        graficos: {
          receitas_por_tipo: receitasData,
          despesas_mensais: despesasMensais,
          despesas_por_categoria: despesasPorCategoria
        },
        top_montadores: topMontadores
      }
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar dashboard',
      error: error.message
    });
  }
});

module.exports = router;
