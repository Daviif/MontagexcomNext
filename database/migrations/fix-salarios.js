// Execute from project root: node database/migrations/fix-salarios.js
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
    // Remover colchetes se existirem
    value = value.replace(/^\[|\]$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const { Client } = require(path.join(__dirname, '../../backend/node_modules/pg'));

async function checkAndFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    // 1. Verificar loja DULAR
    console.log('📋 1. VERIFICANDO CONFIGURAÇÃO DA LOJA DULAR:');
    const lojaResult = await client.query(`
      SELECT id, razao_social, nome_fantasia, cnpj, usa_porcentagem, porcentagem_repasse
      FROM lojas 
      WHERE nome_fantasia LIKE '%DULAR%' OR razao_social LIKE '%DULAR%' OR cnpj LIKE '%01704320001416%'
      LIMIT 1
    `);
    
    if (lojaResult.rows.length === 0) {
      console.log('❌ Loja DULAR não encontrada!\n');
      return;
    }

    const loja = lojaResult.rows[0];
    console.log('Loja:', loja.nome_fantasia || loja.razao_social);
    console.log('CNPJ:', loja.cnpj);
    console.log('Usa porcentagem:', loja.usa_porcentagem);
    console.log('Porcentagem repasse:', loja.porcentagem_repasse, '%\n');

    // 2. Verificar serviços de fevereiro
    console.log('📋 2. SERVIÇOS DE FEVEREIRO 2026:');
    const servicosResult = await client.query(`
      SELECT 
        s.id,
        s.codigo_os_loja,
        s.data_servico,
        s.valor_total,
        s.valor_repasse_montagem,
        s.status
      FROM servicos s
      WHERE s.loja_id = $1
        AND s.data_servico >= '2026-02-01' 
        AND s.data_servico < '2026-03-01'
      ORDER BY s.data_servico
    `, [loja.id]);

    console.log(`Total de serviços: ${servicosResult.rows.length}\n`);
    
    for (const servico of servicosResult.rows) {
      console.log(`Serviço: ${servico.codigo_os_loja || servico.id}`);
      console.log(`  Data: ${servico.data_servico}`);
      console.log(`  Valor Total: R$ ${Number(servico.valor_total).toFixed(2)}`);
      console.log(`  Valor Repasse: R$ ${Number(servico.valor_repasse_montagem).toFixed(2)}`);
      console.log(`  Status: ${servico.status}`);

      // Verificar se o valor_repasse está correto
      const valorEsperado = loja.usa_porcentagem 
        ? (servico.valor_total * loja.porcentagem_repasse / 100)
        : servico.valor_total;
      
      if (Math.abs(servico.valor_repasse_montagem - valorEsperado) > 0.01) {
        console.log(`  ⚠️  ERRO: Deveria ser R$ ${valorEsperado.toFixed(2)}`);
      }

      // Verificar montadores
      const montadoresResult = await client.query(`
        SELECT 
          sm.id,
          sm.usuario_id,
          u.nome,
          sm.valor_atribuido
        FROM servico_montadores sm
        JOIN usuarios u ON sm.usuario_id = u.id
        WHERE sm.servico_id = $1
        ORDER BY u.nome
      `, [servico.id]);

      console.log(`  Montadores: ${montadoresResult.rows.length}`);
      
      const montadoresUnicos = new Set();
      for (const montador of montadoresResult.rows) {
        console.log(`    - ${montador.nome}: R$ ${Number(montador.valor_atribuido).toFixed(2)} `);
        
        if (montadoresUnicos.has(montador.usuario_id)) {
          console.log(`      ❌ DUPLICADO!`);
        }
        montadoresUnicos.add(montador.usuario_id);
      }
      console.log('');
    }

    // 3. Encontrar duplicatas
    console.log('📋 3. VERIFICANDO DUPLICATAS:');
    const duplicatasResult = await client.query(`
      SELECT 
        sm.servico_id,
        s.codigo_os_loja,
        sm.usuario_id,
        u.nome as montador,
        COUNT(*) as quantidade_registros,
        ARRAY_AGG(sm.id) as ids
      FROM servico_montadores sm
      JOIN servicos s ON sm.servico_id = s.id
      JOIN usuarios u ON sm.usuario_id = u.id
      WHERE s.loja_id = $1
        AND s.data_servico >= '2026-02-01' 
        AND s.data_servico < '2026-03-01'
      GROUP BY sm.servico_id, s.codigo_os_loja, sm.usuario_id, u.nome
      HAVING COUNT(*) > 1
    `, [loja.id]);

    if (duplicatasResult.rows.length > 0) {
      console.log(`❌ Encontradas ${duplicatasResult.rows.length} duplicatas:\n`);
      
      for (const dup of duplicatasResult.rows) {
        console.log(`Serviço ${dup.codigo_os_loja}: ${dup.montador} aparece ${dup.quantidade_registros}x`);
        console.log(`  IDs: ${dup.ids.join(', ')}`);
      }

      console.log('\n🔧 EXECUTANDO CORREÇÃO (remover duplicatas)...');
      
      // Executar migration
      await client.query(`
        DELETE FROM servico_montadores a
        USING servico_montadores b
        WHERE a.id < b.id
          AND a.servico_id = b.servico_id
          AND a.usuario_id = b.usuario_id
          AND a.usuario_id IS NOT NULL
      `);

      console.log('✅ Duplicatas removidas!\n');

      // Adicionar constraint
      try {
        await client.query(`
          ALTER TABLE servico_montadores
          ADD CONSTRAINT unique_servico_usuario 
          UNIQUE (servico_id, usuario_id)
        `);
        console.log('✅ Constraint UNIQUE adicionada!\n');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('ℹ️  Constraint já existe\n');
        } else {
          throw err;
        }
      }
    } else {
      console.log('✅ Nenhuma duplicata encontrada!\n');
    }

    // 4. Verificar se precisa recalcular valor_repasse_montagem
    console.log('📋 4. VERIFICANDO VALORES DE REPASSE:');
    const servicosParaCorrigir = servicosResult.rows.filter(servico => {
      const valorEsperado = loja.usa_porcentagem 
        ? (servico.valor_total * loja.porcentagem_repasse / 100)
        : servico.valor_total;
      return Math.abs(servico.valor_repasse_montagem - valorEsperado) > 0.01;
    });

    if (servicosParaCorrigir.length > 0) {
      console.log(`❌ ${servicosParaCorrigir.length} serviço(s) com valor_repasse_montagem incorreto\n`);
      
      for (const servico of servicosParaCorrigir) {
        const valorCorreto = loja.usa_porcentagem 
          ? (servico.valor_total * loja.porcentagem_repasse / 100)
          : servico.valor_total;
        
        console.log(`Serviço ${servico.codigo_os_loja}:`);
        console.log(`  Atual: R$ ${Number(servico.valor_repasse_montagem).toFixed(2)}`);
        console.log(`  Deveria ser: R$ ${valorCorreto.toFixed(2)}`);

        // Atualizar
        await client.query(`
          UPDATE servicos 
          SET valor_repasse_montagem = $1 
          WHERE id = $2
        `, [valorCorreto, servico.id]);

        // Recalcular valor_atribuido dos montadores
        const montadores = await client.query(`
          SELECT id FROM servico_montadores WHERE servico_id = $1
        `, [servico.id]);

        const valorPorMontador = valorCorreto / montadores.rows.length;

        await client.query(`
          UPDATE servico_montadores 
          SET valor_atribuido = $1 
          WHERE servico_id = $2
        `, [valorPorMontador, servico.id]);

        console.log(`  ✅ Corrigido!\n`);
      }
    } else {
      console.log('✅ Todos os valores de repasse estão corretos!\n');
    }

    console.log('✅ VERIFICAÇÃO E CORREÇÃO CONCLUÍDAS!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

checkAndFix();
