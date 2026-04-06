const express = require('express');
const router = express.Router();
const { models } = require('../models');
const { Op } = require('sequelize');

const formatDateOnly = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDateOnly = (value, fallback) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return fallback;
};

/**
 * GET /api/v1/dashboard/salarios
 * 
 * Retorna cálculo de salários dos montadores baseado nos serviços realizados
 * Query params:
 *  - data_inicio: Data inicial (YYYY-MM-DD)
 *  - data_fim: Data final (YYYY-MM-DD)
 *  - usuario_id: Filtrar por montador específico
 */
router.get('/', async (req, res) => {
  try {
    const { data_inicio, data_fim, usuario_id, debug } = req.query;
    const isDebug = debug === '1' || debug === 'true';
    
    // Definir período padrão (mês atual se não especificado)
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    // Manter datas como DATEONLY para evitar deslocamento de fuso (data - 1)
    const dataInicio = normalizeDateOnly(data_inicio, formatDateOnly(inicioMes));
    const dataFim = normalizeDateOnly(data_fim, formatDateOnly(fimMes));
    
    // Buscar configurações de salário
    const configFormula = await models.Configuracao.findOne({
      where: { chave: 'salario_formula' }
    });
    
    const configBase = await models.Configuracao.findOne({
      where: { chave: 'salario_base_padrao' }
    });
    
    const formula = configFormula?.valor || 'valor_montagem';
    const salarioBase = parseFloat(configBase?.valor || 0);
    
    // Buscar todos os montadores
    const whereUsuario = usuario_id ? { id: usuario_id } : { tipo: 'montador', ativo: true };
    
    const montadores = await models.Usuario.findAll({
      where: whereUsuario,
      attributes: ['id', 'nome', 'percentual_salario']
    });

    const percentualSalarioByUsuario = montadores.reduce((acc, montador) => {
      const percentual = Math.min(Math.max(Number(montador.percentual_salario ?? 50), 0), 100);
      acc[montador.id] = percentual;
      return acc;
    }, {});

    const resultado = {
      periodo: {
        inicio: dataInicio,
        fim: dataFim
      },
      formula_atual: formula,
      montadores: [],
      totais: {
        total_montadores: 0,
        total_servicos: 0,
        total_valor_montagens: 0,
        total_salarios: 0
      }
    };
    
    const servicosPeriodo = await models.Servico.findAll({
      where: {
        data_servico: {
          [Op.between]: [dataInicio, dataFim]
        },
        status: 'concluido'
      },
      include: [{
        model: models.Loja,
        as: 'Loja',
        attributes: ['id', 'usa_porcentagem', 'porcentagem_repasse', 'nome_fantasia', 'razao_social']
      }],
      attributes: ['id', 'codigo_os_loja', 'codigo_os_loja', 'data_servico', 'valor_total', 'valor_repasse_montagem', 'tipo_cliente', 'loja_id', 'cliente_particular_id']
    });

    const servicoById = servicosPeriodo.reduce((acc, servico) => {
      acc[servico.id] = servico;
      return acc;
    }, {});

    const servicoIds = servicosPeriodo.map((servico) => servico.id);
    const servicosMontadoresPeriodo = servicoIds.length > 0
      ? await models.ServicoMontador.findAll({
          where: {
            servico_id: { [Op.in]: servicoIds }
          },
          attributes: ['id', 'servico_id', 'usuario_id', 'equipe_id', 'valor_atribuido',  'percentual_divisao']
        })
      : [];

    const equipeIds = Array.from(new Set(
      servicosMontadoresPeriodo
        .map((sm) => sm.equipe_id)
        .filter(Boolean)
    ));

    const equipeMembros = equipeIds.length > 0
      ? await models.EquipeMembro.findAll({
          where: {
            equipe_id: { [Op.in]: equipeIds }
          },
          attributes: ['equipe_id', 'usuario_id']
        })
      : [];

    const membrosPorEquipe = equipeMembros.reduce((acc, membro) => {
      if (!acc[membro.equipe_id]) {
        acc[membro.equipe_id] = new Set();
      }
      acc[membro.equipe_id].add(membro.usuario_id);
      return acc;
    }, {});

    const atribuicoesOriginaisPorServico = servicosMontadoresPeriodo.reduce((acc, sm) => {
      acc[sm.servico_id] = (acc[sm.servico_id] || 0) + 1;
      return acc;
    }, {});

    const atribuicoesExpandidas = servicosMontadoresPeriodo.flatMap((sm) => {
      if (sm.usuario_id) {
        return [{
          ...sm.toJSON(),
          _sourceId: sm.id,
          _fromEquipe: Boolean(sm.equipe_id),
          _equipeMembrosCount: 1
        }];
      }

      if (sm.equipe_id) {
        const membros = Array.from(membrosPorEquipe[sm.equipe_id] || []);
        return membros.map((usuarioId) => ({
          ...sm.toJSON(),
          usuario_id: usuarioId,
          _sourceId: sm.id,
          _fromEquipe: true,
          // Se tem percentual_divisao, já foi aplicado no valor_atribuido, então não dividir
          _equipeMembrosCount: (sm.percentual_divisao != null && Number(sm.percentual_divisao) > 0) ? 1 : membros.length || 1
        }));
      }

      return [];
    });

    const servicoProdutosPeriodo = servicoIds.length > 0
      ? await models.ServicoProduto.findAll({
          where: {
            servico_id: { [Op.in]: servicoIds }
          },
          attributes: ['servico_id', 'quantidade', 'valor_unitario', 'valor_total']
        })
      : [];

    const totalProdutosPorServico = servicoProdutosPeriodo.reduce((acc, sp) => {
      const totalItem = sp.valor_total != null
        ? Number(sp.valor_total)
        : Number(sp.quantidade || 0) * Number(sp.valor_unitario || 0);
      acc[sp.servico_id] = (acc[sp.servico_id] || 0) + (Number.isNaN(totalItem) ? 0 : totalItem);
      return acc;
    }, {});

    const getValorCheio = (servico) => {
      const valorTotal = Number(servico.valor_total || 0);
      if (valorTotal > 0) return valorTotal;

      const valorRepasse = Number(servico.valor_repasse_montagem || 0);
      if (valorRepasse > 0) return valorRepasse;

      const totalProdutos = Number(totalProdutosPorServico[servico.id] || 0);
      return totalProdutos;
    };

    const calcularValorAtribuido = (sm) => {
      const passos = {};
      const servico = servicoById[sm.servico_id];
      if (!servico) return { valor: 0, valorCheio: 0, valorCalculadoCliente: 0, passos: { erro: 'Serviço não encontrado' } };

      // Etapa 1: determinar valor base do serviço (valor_repasse_montagem)
      const valorCheio = getValorCheio(servico);
      let valorBase = 0;
      if (servico.valor_repasse_montagem != null && Number(servico.valor_repasse_montagem) > 0) {
        valorBase = Number(servico.valor_repasse_montagem);
        passos.etapa1_fonte = 'valor_repasse_montagem';
      } else {
        const loja = servico.tipo_cliente === 'loja' ? servico.Loja : null;
        const usaPct = loja?.usa_porcentagem && loja?.porcentagem_repasse != null && Number(loja.porcentagem_repasse) > 0;
        valorBase = usaPct ? (valorCheio * Number(loja.porcentagem_repasse)) / 100 : valorCheio;
        passos.etapa1_fonte = usaPct ? 'porcentagem_loja_calculada' : 'valor_cheio_fallback';
        passos.etapa1_porcentagem_loja = loja?.porcentagem_repasse ?? null;
      }
      passos.etapa1_valor_cheio = valorCheio;
      passos.etapa1_valor_base = valorBase;

      // Etapa 2: aplicar divisão baseada no tipo de serviço (individual ou equipe)
      const totalAtribuicoes = atribuicoesOriginaisPorServico[sm.servico_id] || 1;
      const isIndividual = totalAtribuicoes === 1;
      
      let valorFinal;
      
      if (isIndividual) {
        // INDIVIDUAL: valor_base × percentual_salario
        const percentualSalario = percentualSalarioByUsuario[sm.usuario_id] ?? 50;
        valorFinal = valorBase * (percentualSalario / 100);
        passos.etapa2_tipo = 'individual';
        passos.etapa2_percentual_salario = percentualSalario;
        passos.etapa2_formula = `${valorBase.toFixed(4)} × ${percentualSalario}% = ${valorFinal.toFixed(4)}`;
      } else {
        // EQUIPE: valor_base × percentual_divisao
        if (sm.percentual_divisao != null && Number(sm.percentual_divisao) > 0) {
          valorFinal = (valorBase * Number(sm.percentual_divisao)) / 100;
          passos.etapa2_tipo = 'equipe_com_divisao';
          passos.etapa2_percentual_divisao = Number(sm.percentual_divisao);
          passos.etapa2_formula = `${valorBase.toFixed(4)} × ${sm.percentual_divisao}% = ${valorFinal.toFixed(4)}`;
        } else {
          // Fallback: divisão igualitária (não deveria acontecer em equipes bem configuradas)
          valorFinal = valorBase / totalAtribuicoes;
          passos.etapa2_tipo = 'equipe_sem_divisao_fallback';
          passos.etapa2_total_montadores = totalAtribuicoes;
          passos.etapa2_formula = `${valorBase.toFixed(4)} ÷ ${totalAtribuicoes} = ${valorFinal.toFixed(4)}`;
        }
      }
      passos.etapa2_valor_final = valorFinal;

      return {
        valor: valorFinal,
        valorCheio,
        valorCalculadoCliente: valorBase,
        passos
      };
    };

    // Para cada montador, calcular seus valores
    for (const montador of montadores) {
      const servicosMontador = atribuicoesExpandidas.filter((sm) => sm.usuario_id === montador.id);

      const valorMontagens = servicosMontador.reduce(
        (sum, sm) => sum + parseFloat(calcularValorAtribuido(sm).valor || 0),
        0
      );
      
      // Aplicar fórmula de cálculo
      let salarioCalculado = valorMontagens;
      try {
        // Substituir variável na fórmula e calcular
        const formulaCalculada = formula.replace('valor_montagem', valorMontagens.toString());
        salarioCalculado = eval(formulaCalculada) + salarioBase;
      } catch (error) {
        console.error('Erro ao calcular fórmula:', error);
        salarioCalculado = valorMontagens + salarioBase;
      }
      
      // Montar detalhes dos serviços
      const detalhes = servicosMontador.map(sm => {
        const servico = servicoById[sm.servico_id];
        const {
          valor: valorCalculado,
          valorCheio,
          valorCalculadoCliente,
          passos
        } = calcularValorAtribuido(sm);

        return {
          servico_id: sm.servico_id,
          codigo_os_loja: servico?.codigo_os_loja,
          codigo_os_loja: servico?.codigo_os_loja,
          data_servico: servico?.data_servico,
          valor_cheio: parseFloat(valorCheio || 0),
          valor_calculado: parseFloat(valorCalculadoCliente || 0),
          valor_atribuido: parseFloat(valorCalculado || 0),
          percentual_divisao: parseFloat(sm.percentual_divisao || 0),
          equipe_id: sm.equipe_id || null,
          ...(isDebug && { _debug: passos })
        };
      });
      
      resultado.montadores.push({
        usuario_id: montador.id,
        nome: montador.nome,
        percentual_salario: Number(montador.percentual_salario ?? 50),
        servicos_realizados: servicosMontador.length,
        valor_montagens: parseFloat(valorMontagens.toFixed(2)),
        valor_base: salarioBase,
        salario_calculado: parseFloat(salarioCalculado.toFixed(2)),
        detalhes
      });
      
      // Atualizar totais
      resultado.totais.total_servicos += servicosMontador.length;
      resultado.totais.total_valor_montagens += valorMontagens;
      resultado.totais.total_salarios += salarioCalculado;
    }
    
    // Atualizar contagem de montadores
    resultado.totais.total_montadores = resultado.montadores.length;
    resultado.totais.total_valor_montagens = parseFloat(resultado.totais.total_valor_montagens.toFixed(2));
    resultado.totais.total_salarios = parseFloat(resultado.totais.total_salarios.toFixed(2));
    
    res.json({
      success: true,
      data: resultado
    });
    
  } catch (error) {
    console.error('Erro ao calcular salários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao calcular salários',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/dashboard/salarios/:usuario_id/detalhado
 * 
 * Retorna detalhamento completo de salário de um montador específico
 */
router.get('/:usuario_id/detalhado', async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const { data_inicio, data_fim } = req.query;
    
    // Buscar montador
    const montador = await models.Usuario.findByPk(usuario_id);
    if (!montador) {
      return res.status(404).json({
        success: false,
        message: 'Montador não encontrado'
      });
    }
    
    // Reutilizar lógica do endpoint principal com filtro de usuário
    const response = await fetch(
      `/dashboard/salarios?usuario_id=${usuario_id}&data_inicio=${data_inicio}&data_fim=${data_fim}`
    );

    res.json(response);
    
  } catch (error) {
    console.error('Erro ao buscar detalhes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar detalhes',
      error: error.message
    });
  }
});

module.exports = router;
