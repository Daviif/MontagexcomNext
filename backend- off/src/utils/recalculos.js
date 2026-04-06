/**
 * Utilitário para recálculo automático de valores
 * Usado por hooks dos modelos para manter valores sincronizados
 */

const { Op } = require('sequelize');

/**
 * Recalcula valor_repasse_montagem de um serviço baseado na loja
 */
async function recalcularValorRepasseServico(servico, models) {
  if (servico.tipo_cliente !== 'loja' || !servico.loja_id) {
    return;
  }

  const loja = await models.Loja.findByPk(servico.loja_id);
  if (!loja) return;

  const valorTotal = Number(servico.valor_total || 0);
  const usaPorcentagem = loja.usa_porcentagem;
  const porcentagemRepasse = Number(loja.porcentagem_repasse || 0);

  const novoValorRepasse = usaPorcentagem && porcentagemRepasse > 0
    ? (valorTotal * porcentagemRepasse) / 100
    : valorTotal;

  // Atualizar apenas se mudou
  if (Number(servico.valor_repasse_montagem) !== Number(novoValorRepasse.toFixed(2))) {
    await servico.update(
      { valor_repasse_montagem: Number(novoValorRepasse.toFixed(2)) },
      { hooks: false } // Evita loop infinito
    );
  }

  return novoValorRepasse;
}

/**
 * Recalcula valores_atribuido de todos os montadores de um serviço
 */
async function recalcularValoresMontadores(servicoId, valorRepasseMontagem, models) {
  const montadores = await models.ServicoMontador.findAll({
    where: { servico_id: servicoId }
  });

  if (montadores.length === 0) return;

  const isIndividual = montadores.length === 1;

  // Buscar percentual_salario apenas para caso individual
  const percentualPorUsuario = {};
  if (isIndividual && montadores[0].usuario_id && !montadores[0].equipe_id) {
    const usuario = await models.Usuario.findByPk(montadores[0].usuario_id, {
      attributes: ['id', 'percentual_salario']
    });
    if (usuario) {
      percentualPorUsuario[usuario.id] = Math.min(Math.max(Number(usuario.percentual_salario ?? 50), 0), 100);
    }
  }

  const valorRepasse = Number(valorRepasseMontagem || 0);

  for (const montador of montadores) {
    let novoValorMontador;

    if (isIndividual && !montador.equipe_id && montador.usuario_id) {
      // Individual: valor_repasse × percentual_salario do cadastro
      const percentualSalario = percentualPorUsuario[montador.usuario_id] ?? 50;
      novoValorMontador = valorRepasse * (percentualSalario / 100);
    } else if (montador.percentual_divisao != null && Number(montador.percentual_divisao) > 0) {
      // Equipe: valor_repasse × percentual_divisao definido
      novoValorMontador = (valorRepasse * Number(montador.percentual_divisao)) / 100;
    } else {
      // Fallback: divisão igualitária
      novoValorMontador = valorRepasse / montadores.length;
    }

    // Atualizar apenas se mudou
    if (Number(montador.valor_atribuido) !== Number(novoValorMontador.toFixed(2))) {
      await montador.update(
        { valor_atribuido: Number(novoValorMontador.toFixed(2)) },
        { hooks: false } // Evita loop infinito
      );
    }
  }
}

/**
 * Recalcula todos os serviços de uma loja quando sua configuração muda
 */
async function recalcularServicosLoja(lojaId, models) {
  const loja = await models.Loja.findByPk(lojaId);
  if (!loja) return;

  const servicos = await models.Servico.findAll({
    where: {
      loja_id: lojaId,
      tipo_cliente: 'loja'
    }
  });

  console.log(`🔄 Recalculando ${servicos.length} serviços da loja ${loja.nome_fantasia || loja.razao_social}...`);

  const usaPorcentagem = loja.usa_porcentagem;
  const porcentagemRepasse = Number(loja.porcentagem_repasse || 0);

  for (const servico of servicos) {
    const valorTotal = Number(servico.valor_total || 0);
    
    const novoValorRepasse = usaPorcentagem && porcentagemRepasse > 0
      ? (valorTotal * porcentagemRepasse) / 100
      : valorTotal;

    // Atualizar serviço (sem gancho para evitar loop)
    await servico.update(
      { valor_repasse_montagem: Number(novoValorRepasse.toFixed(2)) },
      { hooks: false }
    );

    // Recalcular montadores
    await recalcularValoresMontadores(servico.id, novoValorRepasse, models);
  }

  console.log(`✅ Recálculo concluído: ${servicos.length} serviço(s) atualizados`);
}

/**
 * Recalcula valor_atribuido de um montador específico
 */
async function recalcularValorMontador(montadorId, models) {
  const montador = await models.ServicoMontador.findByPk(montadorId);
  if (!montador) return;

  const servico = await models.Servico.findByPk(montador.servico_id, {
    include: [{ model: models.Loja }]
  });
  if (!servico) return;

  // Pegar ou calcular valor_repasse_montagem
  let valorRepasse = Number(servico.valor_repasse_montagem || 0);
  
  if (valorRepasse === 0 && servico.tipo_cliente === 'loja' && servico.Loja) {
    const valorTotal = Number(servico.valor_total || 0);
    const usaPorcentagem = servico.Loja.usa_porcentagem;
    const porcentagemRepasse = Number(servico.Loja.porcentagem_repasse || 0);
    
    valorRepasse = usaPorcentagem && porcentagemRepasse > 0
      ? (valorTotal * porcentagemRepasse) / 100
      : valorTotal;
  }

  // Contar total de montadores
  const totalMontadores = await models.ServicoMontador.count({
    where: { servico_id: servico.id }
  });

  const usuario = montador.usuario_id
    ? await models.Usuario.findByPk(montador.usuario_id, { attributes: ['id', 'percentual_salario'] })
    : null;
  const percentualCadastro = Math.min(Math.max(Number(usuario?.percentual_salario ?? 50), 0), 100);

  let novoValorMontador;

  if (montador.equipe_id) {
    const percentualEquipe = montador.percentual_divisao != null
      ? Math.min(Math.max(Number(montador.percentual_divisao), 0), 100)
      : percentualCadastro;
    novoValorMontador = (valorRepasse / totalMontadores) * (percentualEquipe / 100);
  } else if (montador.percentual_divisao != null && Number(montador.percentual_divisao) > 0) {
    novoValorMontador = ((valorRepasse * Number(montador.percentual_divisao)) / 100) * (percentualCadastro / 100);
  } else {
    novoValorMontador = (valorRepasse / totalMontadores) * (percentualCadastro / 100);
  }

  // Atualizar apenas se mudou
  if (Number(montador.valor_atribuido) !== Number(novoValorMontador.toFixed(2))) {
    await montador.update(
      { valor_atribuido: Number(novoValorMontador.toFixed(2)) },
      { hooks: false }
    );
  }
}

module.exports = {
  recalcularValorRepasseServico,
  recalcularValoresMontadores,
  recalcularServicosLoja,
  recalcularValorMontador
};
