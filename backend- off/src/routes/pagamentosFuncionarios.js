const path = require('path');
const fs = require('fs');
const multer = require('multer');
const createCrudRouter = require('./crudRouter');
const { models, sequelize } = require('../models');

const uploadsDir = path.join(__dirname, '../../uploads/pagamentos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const extensoesPermitidas = [
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv',
  'mp3', 'wav', 'mp4', 'avi', 'mov', 'mkv', 'webm',
  'zip', 'rar', '7z'
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadsDir, req.params.id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const rand = Math.random().toString(36).substring(7);
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${timestamp}-${rand}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    if (extensoesPermitidas.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Extensão .${ext} não permitida`));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

const isMontador = (req) => req.user?.tipo === 'montador';

const toNumber = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundMoney = (value) => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const normalizeDateOnly = (value) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

const computeStatus = (valorPrevisto, valorPago) => {
  if (valorPago <= 0) {
    return 'pendente';
  }

  if (valorPago + 0.009 < valorPrevisto) {
    return 'parcial';
  }

  return 'pago';
};

const createPagamentosFuncionariosRouter = (crudOptions = {}) => {
  const router = createCrudRouter(models.PagamentoFuncionario, crudOptions);

  router.get('/:id/baixas', async (req, res, next) => {
    try {
      const pagamento = await models.PagamentoFuncionario.findByPk(req.params.id);
      if (!pagamento) {
        return res.status(404).json({ error: 'Not found' });
      }

      if (isMontador(req) && pagamento.usuario_id !== req.user.id) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Mantem o mesmo comportamento de privacidade: montador so ve detalhes quando pago.
      if (isMontador(req) && pagamento.status !== 'pago') {
        return res.json([]);
      }

      const baixas = await models.PagamentoFuncionarioBaixa.findAll({
        where: { pagamento_funcionario_id: req.params.id },
        order: [['data_pagamento', 'ASC'], ['created_at', 'ASC']]
      });

      return res.json(baixas);
    } catch (err) {
      return next(err);
    }
  });

  router.post('/:id/baixas', async (req, res, next) => {
    try {
      const { valor, data_pagamento, forma_pagamento, observacoes } = req.body || {};
      const valorBaixa = roundMoney(valor);

      if (valorBaixa <= 0) {
        return res.status(400).json({
          error: 'Valor invalido',
          details: [{ field: 'valor', message: 'Informe um valor maior que zero' }]
        });
      }

      if (data_pagamento && !/^\d{4}-\d{2}-\d{2}$/.test(data_pagamento)) {
        return res.status(400).json({
          error: 'Data invalida',
          details: [{ field: 'data_pagamento', message: 'Formato esperado: YYYY-MM-DD' }]
        });
      }

      const result = await sequelize.transaction(async (transaction) => {
        const pagamento = await models.PagamentoFuncionario.findByPk(req.params.id, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        if (!pagamento) {
          const error = new Error('Not found');
          error.statusCode = 404;
          throw error;
        }

        const valorPrevisto = roundMoney(pagamento.valor);
        const valorPagoAtual = roundMoney(pagamento.valor_pago);
        const saldoAtual = roundMoney(valorPrevisto - valorPagoAtual);

        if (saldoAtual <= 0) {
          const error = new Error('Pagamento ja esta quitado');
          error.statusCode = 400;
          error.payload = {
            error: 'Pagamento ja quitado',
            details: [{ field: 'valor', message: 'Nao ha saldo pendente para este pagamento' }]
          };
          throw error;
        }

        if (valorBaixa > saldoAtual + 0.009) {
          const error = new Error('Valor maior que saldo');
          error.statusCode = 400;
          error.payload = {
            error: 'Valor acima do saldo',
            details: [{
              field: 'valor',
              message: `Saldo pendente atual: ${saldoAtual.toFixed(2)}`
            }]
          };
          throw error;
        }

        const dataBaixa = normalizeDateOnly(data_pagamento);

        const baixa = await models.PagamentoFuncionarioBaixa.create({
          pagamento_funcionario_id: pagamento.id,
          valor: valorBaixa,
          data_pagamento: dataBaixa,
          forma_pagamento: forma_pagamento || null,
          observacoes: observacoes || null,
          responsavel_id: req.user?.id || null
        }, { transaction });

        const novoValorPago = roundMoney(valorPagoAtual + valorBaixa);
        const novoStatus = computeStatus(valorPrevisto, novoValorPago);

        await pagamento.update({
          valor_pago: novoValorPago,
          status: novoStatus,
          data_pagamento: dataBaixa,
          responsavel_id: pagamento.responsavel_id || req.user?.id || null
        }, { transaction });

        return {
          pagamento,
          baixa,
          saldo_restante: roundMoney(valorPrevisto - novoValorPago)
        };
      });

      return res.status(201).json({
        success: true,
        data: {
          pagamento: result.pagamento,
          baixa: result.baixa,
          saldo_restante: result.saldo_restante
        }
      });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json(err.payload || { error: err.message });
      }

      return next(err);
    }
  });

  // ── Comprovantes/Anexos ──────────────────────────────────────────────────

  router.get('/:id/anexos', async (req, res, next) => {
    try {
      const pagamento = await models.PagamentoFuncionario.findByPk(req.params.id);
      if (!pagamento) return res.status(404).json({ error: 'Not found' });

      if (isMontador(req) && pagamento.usuario_id !== req.user.id) {
        return res.status(404).json({ error: 'Not found' });
      }

      const anexos = await models.PagamentoFuncionarioAnexo.findAll({
        where: { pagamento_funcionario_id: req.params.id },
        order: [['criado_em', 'DESC']]
      });
      return res.json(anexos);
    } catch (err) {
      return next(err);
    }
  });

  router.post('/:id/anexos', upload.single('arquivo'), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      const pagamento = await models.PagamentoFuncionario.findByPk(req.params.id);
      if (!pagamento) {
        fs.unlink(req.file.path, () => {});
        return res.status(404).json({ error: 'Pagamento não encontrado' });
      }

      if (isMontador(req) && pagamento.usuario_id !== req.user.id) {
        fs.unlink(req.file.path, () => {});
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const ext = path.extname(req.file.filename).toLowerCase().substring(1);

      const anexo = await models.PagamentoFuncionarioAnexo.create({
        pagamento_funcionario_id: req.params.id,
        nome_arquivo: req.file.originalname,
        extensao: ext,
        tipo_mime: req.file.mimetype,
        tamanho_bytes: req.file.size,
        caminho_arquivo: `/uploads/pagamentos/${req.params.id}/${req.file.filename}`,
        descricao: req.body.descricao || null,
        criado_por: req.user?.id || null
      });

      return res.status(201).json(anexo);
    } catch (err) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return next(err);
    }
  });

  router.get('/anexos/download/:pagamentoId/:arquivo', (req, res, next) => {
    try {
      const filepath = path.join(uploadsDir, req.params.pagamentoId, req.params.arquivo);
      const normalizado = path.normalize(filepath);
      if (!normalizado.startsWith(path.normalize(uploadsDir))) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      if (!fs.existsSync(normalizado)) {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }
      return res.download(normalizado);
    } catch (err) {
      return next(err);
    }
  });

  router.delete('/anexos/:anexoId', async (req, res, next) => {
    try {
      const anexo = await models.PagamentoFuncionarioAnexo.findByPk(req.params.anexoId);
      if (!anexo) return res.status(404).json({ error: 'Anexo não encontrado' });

      if (isMontador(req)) {
        return res.status(403).json({ error: 'Apenas administradores podem remover anexos' });
      }

      const filepath = path.join(
        uploadsDir,
        anexo.pagamento_funcionario_id,
        path.basename(anexo.caminho_arquivo)
      );
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

      await anexo.destroy();
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  });

  return router;
};

module.exports = createPagamentosFuncionariosRouter;
