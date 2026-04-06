// Exemplo de sessão de usuário em Redis

const { setCache, getCache, delCache } = require('../utils/cache');

class SessionManager {
  constructor() {
    this.sessionTTL = 7 * 24 * 60 * 60; // 7 dias
  }

  async createSession(usuarioId, dados) {
    const sessionId = require('uuid').v4();
    const sessionKey = `session:${sessionId}`;

    await setCache(sessionKey, {
      usuarioId,
      ...dados,
      createdAt: new Date(),
      lastActivity: new Date()
    }, this.sessionTTL);

    return sessionId;
  }

  async getSession(sessionId) {
    const sessionKey = `session:${sessionId}`;
    const session = await getCache(sessionKey);

    if (session) {
      // Atualizar lastActivity
      session.lastActivity = new Date();
      await setCache(sessionKey, session, this.sessionTTL);
    }

    return session;
  }

  async deleteSession(sessionId) {
    const sessionKey = `session:${sessionId}`;
    return await delCache(sessionKey);
  }

  async isSessionValid(sessionId) {
    const session = await this.getSession(sessionId);
    return session !== null;
  }

  async updateSession(sessionId, dados) {
    const sessionKey = `session:${sessionId}`;
    const session = await getCache(sessionKey);

    if (!session) {
      return null;
    }

    const updated = { ...session, ...dados, lastActivity: new Date() };
    await setCache(sessionKey, updated, this.sessionTTL);

    return updated;
  }
}

module.exports = new SessionManager();
