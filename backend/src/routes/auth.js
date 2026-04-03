const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { models } = require('../models');

const router = express.Router();
const { Usuario } = models;

const mapUsuarioAuth = (usuario) => ({
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

// POST /auth/login - Faz login e retorna JWT
router.post('/login', async (req, res, next) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    if (!usuario.ativo) {
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      usuario: mapUsuarioAuth(usuario)
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/register - Cadastra novo usuário
router.post('/register', async (req, res, next) => {
  try {
    const { nome, email, senha, tipo } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    if (tipo && !['admin', 'montador'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido' });
    }

    const usuarioExistente = await Usuario.findOne({ where: { email } });

    if (usuarioExistente) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await Usuario.create({
      nome,
      email,
      senha_hash: senhaHash,
      tipo: tipo || 'montador',
      ativo: true
    });

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      usuario: mapUsuarioAuth(usuario)
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
