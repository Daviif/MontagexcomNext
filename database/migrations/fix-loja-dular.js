// Script para corrigir a configuração da loja DULAR
// Execute: node database/migrations/fix-loja-dular.js <porcentagem>
// Exemplo: node database/migrations/fix-loja-dular.js 5

const path = require('path');
const fs = require('fs');

// Ler .env manualmente
const envPath = path.join(__dirname, '../../backend/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    value = value.replace(/^\[|\]$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const { Client } = require(path.join(__dirname, '../../backend/node_modules/pg'));

async function fixLojaDular() {
  const porcentagem = process.argv[2] ? parseFloat(process.argv[2]) : null;
  
  if (!porcentagem || porcentagem <= 0 || porcentagem > 100) {
    console.log('❌ Erro: Forneça uma porcentagem válida entre 0 e 100');
    console.log('Uso: node database/migrations/fix-loja-dular.js <porcentagem>');
    console.log('Exemplo: node database/migrations/fix-loja-dular.js 5');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    // Buscar loja DULAR
    const lojaResult = await client.query(`
      SELECT id, razao_social, nome_fantasia, cnpj, usa_porcentagem, porcentagem_repasse
      FROM lojas 
      WHERE nome_fantasia LIKE '%DULAR%' OR razao_social LIKE '%DULAR%' OR cnpj LIKE '%01704320001416%'
      LIMIT 1
    `);
    
    if (lojaResult.rows.length === 0) {
      console.log('❌ Loja DULAR não encontrada!');
      process.exit(1);
    }

    const loja = lojaResult.rows[0];
    console.log('📋 LOJA ENCONTRADA:');
    console.log(`Nome: ${loja.nome_fantasia || loja.razao_social}`);
    console.log(`CNPJ: ${loja.cnpj}`);
    console.log(`Usa porcentagem: ${loja.usa_porcentagem}`);
    console.log(`Porcentagem atual: ${loja.porcentagem_repasse}%\n`);

    // Atualizar configuração
    console.log(`🔧 ATUALIZANDO PARA ${porcentagem}%...`);
    await client.query(`
      UPDATE lojas 
      SET usa_porcentagem = true, 
          porcentagem_repasse = $1
      WHERE id = $2
    `, [porcentagem, loja.id]);
    console.log('✅ Configuração da loja atualizada!\n');

    // Recalcular serviços de fevereiro
    console.log('🔧 RECALCULANDO SERVIÇOS DE FEVEREIRO 2026...');
    const servicosResult = await client.query(`
      SELECT id, valor_total, valor_repasse_montagem
      FROM servicos 
      WHERE loja_id = $1
        AND data_servico >= '2026-02-01'
        AND data_servico < '2026-03-01'
    `, [loja.id]);

    for (const servico of servicosResult.rows) {
      const novoValorRepasse = (servico.valor_total * porcentagem) / 100;
      
      console.log(`  Serviço ${servico.id.substring(0, 8)}...:`);
      console.log(`    Valor total: R$ ${Number(servico.valor_total).toFixed(2)}`);
      console.log(`    Repasse antigo: R$ ${Number(servico.valor_repasse_montagem).toFixed(2)}`);
      console.log(`    Repasse novo: R$ ${novoValorRepasse.toFixed(2)}`);

      // Atualizar serviço
      await client.query(`
        UPDATE servicos 
        SET valor_repasse_montagem = $1
        WHERE id = $2
      `, [novoValorRepasse, servico.id]);

      // Recalcular montadores
      const montadoresResult = await client.query(`
        SELECT id FROM servico_montadores WHERE servico_id = $1
      `, [servico.id]);

      if (montadoresResult.rows.length > 0) {
        const valorPorMontador = novoValorRepasse / montadoresResult.rows.length;
        
        await client.query(`
          UPDATE servico_montadores 
          SET valor_atribuido = $1
          WHERE servico_id = $2
        `, [valorPorMontador, servico.id]);

        console.log(`    Montadores atualizados: ${montadoresResult.rows.length}x R$ ${valorPorMontador.toFixed(2)}`);
      }
      console.log('');
    }

    console.log(`✅ ${servicosResult.rows.length} serviço(s) recalculado(s)!`);
    console.log('\n✅ CORREÇÃO CONCLUÍDA!');
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('1. Reinicie o backend se estiver rodando');
    console.log('2. Atualize a página do frontend (F5)');
    console.log('3. Verifique se os valores estão corretos no dashboard de salários');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

fixLojaDular();
