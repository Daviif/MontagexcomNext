const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { models } = require('../models');

const router = express.Router();

// Diretório de uploads
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const servicoDir = path.join(uploadsDir, req.params.servicoId);
    if (!fs.existsSync(servicoDir)) {
      fs.mkdirSync(servicoDir, { recursive: true });
    }
    cb(null, servicoDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${timestamp}-${randomStr}${ext}`);
  }
});

// Extensões permitidas (imagens + documentos + vídeos + áudio)
const extensoesPermitidas = [
  // Imagens
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff',
  // Documentos
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv',
  // Áudio
  'mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg', 'wma',
  // Vídeo
  'mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm', 'MOV', 'MP4',
  // Compactados
  'zip', 'rar', '7z', 'tar', 'gz'
];

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    
    if (extensoesPermitidas.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Extensão ${ext} não permitida`));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// GET - Listar anexos de um serviço
router.get('/servicos/:servicoId/anexos', async (req, res, next) => {
  try {
    const anexos = await models.ServicoAnexo.findAll({
      where: { servico_id: req.params.servicoId },
      order: [['criado_em', 'DESC']]
    });
    res.json(anexos);
  } catch (err) {
    next(err);
  }
});

// POST - Upload de anexo
router.post('/servicos/:servicoId/anexos', upload.single('arquivo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const ext = path.extname(req.file.filename).toLowerCase().substring(1);
    const tipoMime = req.file.mimetype;
    const tamanhoBytes = req.file.size;

    const anexo = await models.ServicoAnexo.create({
      servico_id: req.params.servicoId,
      nome_arquivo: req.file.originalname,
      extensao: ext,
      tipo_mime: tipoMime,
      tamanho_bytes: tamanhoBytes,
      caminho_arquivo: `/uploads/${req.params.servicoId}/${req.file.filename}`,
      descricao: req.body.descricao || '',
      criado_por: req.user?.id
    });

    res.status(201).json(anexo);
  } catch (err) {
    // Remover arquivo se houver erro no banco
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    next(err);
  }
});

// GET - Download de anexo
router.get('/anexos/download/:servicoId/:arquivo', (req, res, next) => {
  try {
    const filepath = path.join(uploadsDir, req.params.servicoId, req.params.arquivo);
    
    // Validar que o caminho está dentro do diretório de uploads
    const normalizado = path.normalize(filepath);
    if (!normalizado.startsWith(path.normalize(uploadsDir))) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (!fs.existsSync(normalizado)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    res.download(normalizado);
  } catch (err) {
    next(err);
  }
});

// DELETE - Remover anexo
router.delete('/anexos/:anexoId', async (req, res, next) => {
  try {
    const anexo = await models.ServicoAnexo.findByPk(req.params.anexoId);
    
    if (!anexo) {
      return res.status(404).json({ error: 'Anexo não encontrado' });
    }

    // Remover arquivo do disco
    const filepath = path.join(uploadsDir, anexo.servico_id, path.basename(anexo.caminho_arquivo));
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Remover do banco
    await anexo.destroy();

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
