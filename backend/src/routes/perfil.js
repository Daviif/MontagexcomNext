const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { models } = require('../models');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../../uploads/perfis');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadsDir, req.user.id);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `perfil-${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const mimeType = (file.mimetype || '').toLowerCase();
    if (mimeType.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Apenas imagens são permitidas'));
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const mapUsuario = (usuario) => ({
  id: usuario.id,
  nome: usuario.nome,
  email: usuario.email,
  tipo: usuario.tipo,
  foto_perfil: usuario.foto_perfil || null,
  chave_pix: usuario.chave_pix || null,
  data_nascimento: usuario.data_nascimento || null,
  habilitacao: usuario.habilitacao || null,
  meta_mensal: usuario.meta_mensal != null ? Number(usuario.meta_mensal) : null
});

router.get('/', async (req, res, next) => {
  try {
    const usuario = await models.Usuario.findByPk(req.user.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ usuario: mapUsuario(usuario) });
  } catch (err) {
    next(err);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const usuario = await models.Usuario.findByPk(req.user.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const payload = {};

    if (typeof req.body.chave_pix !== 'undefined') {
      payload.chave_pix = req.body.chave_pix || null;
    }

    if (typeof req.body.data_nascimento !== 'undefined') {
      payload.data_nascimento = req.body.data_nascimento || null;
    }

    if (typeof req.body.habilitacao !== 'undefined') {
      payload.habilitacao = req.body.habilitacao || null;
    }

    if (typeof req.body.meta_mensal !== 'undefined') {
      payload.meta_mensal = req.body.meta_mensal === '' || req.body.meta_mensal == null
        ? null
        : Number(req.body.meta_mensal);
    }

    if (typeof req.body.nome !== 'undefined' && String(req.body.nome).trim()) {
      payload.nome = String(req.body.nome).trim();
    }

    await usuario.update(payload);

    res.json({ usuario: mapUsuario(usuario) });
  } catch (err) {
    next(err);
  }
});

router.post('/foto', upload.single('foto'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const usuario = await models.Usuario.findByPk(req.user.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const previousPath = usuario.foto_perfil;
    const novaFotoPath = `/uploads/perfis/${req.user.id}/${req.file.filename}`;

    await usuario.update({ foto_perfil: novaFotoPath });

    if (previousPath) {
      const normalizedPrevious = previousPath.replace(/^\//, '');
      const previousFile = path.join(__dirname, '../..', normalizedPrevious);
      if (fs.existsSync(previousFile)) {
        fs.unlink(previousFile, () => {});
      }
    }

    res.json({
      foto_perfil: novaFotoPath,
      usuario: mapUsuario(usuario)
    });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }
    next(err);
  }
});

module.exports = router;
