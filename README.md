# 📦 Montagex - Sistema de Gestão de Montagem de Móveis

Um **sistema completo e profissional** para gerenciar montagem de móveis, incluindo agendamento, equipes, financeiro e muito mais!

## 🎯 O Que é Montagex?

Montagex é uma plataforma integrada que auxilia empresas de manutenção e montagem de móveis a:
- 📅 **Agendar serviços** com clientes (lojas e particulares)
- 👥 **Gerenciar equipes** de montadores
- 🗺️ **Otimizar rotas** e planejamento de deslocamento
- 💰 **Controlar financeiro** (receitas, despesas, pagamentos)
- 📊 **Acompanhar métricas** em tempo real
- 💵 **Calcular salários** baseado em serviços realizados
- 📈 **Gerar relatórios** detalhados

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   CLIENTE                            │
├──────────────────────┬──────────────────────────────┤
│  Frontend Desktop    │  Mobile                      │
│  (React + Electron)  │  (React Native + Expo)       │
└──────────────────────┴──────────────────────────────┘
           │                    │
           └──────────┬─────────┘
                      │ HTTP/WebSocket
           ┌──────────▼──────────┐
           │   API Backend       │
           │  (Node + Express)   │
           └──────────┬──────────┘
                      │
           ┌──────────▼──────────┐
           │  PostgreSQL + Redis │
           │  (Banco de Dados)   │
           └─────────────────────┘
```

## 📁 Estrutura do Projeto

```
Montagex-/
├── backend/                    # 🔧 API REST + WebSocket
│   ├── src/
│   │   ├── models/            # Modelos Sequelize
│   │   ├── routes/            # Rotas da API
│   │   ├── middleware/        # Autenticação, cache
│   │   ├── services/          # Lógica de negócio
│   │   └── app.js             # Aplicação Express
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── frontend-desktop/           # 💻 Aplicação Desktop
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── pages/             # Páginas da aplicação
│   │   ├── contexts/          # Context API
│   │   ├── hooks/             # Custom Hooks
│   │   └── services/          # Cliente HTTP
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
├── mobile/                     # 📱 App Mobile (React Native + Expo)
│   ├── src/
│   │   ├── screens/           # Telas
│   │   ├── components/        # Componentes
│   │   ├── contexts/          # Auth, Theme
│   │   ├── services/          # API, Socket
│   │   └── navigation/        # Navegação
│   ├── App.js
│   ├── app.json
│   ├── package.json
│   ├── README.md
│   └── QUICK-START.md
│
├── database/                   # 🗄️ Schemas SQL
│   ├── schema.sql             # Schema principal
│   └── migrations/
│
└── docs/                       # 📚 Documentação
    ├── API.md                 # Referência da API
    ├── ARQUITETURA.md         # Stack técnico
    ├── SALARIOS-SISTEMA.md    # Sistema de salários
    └── ...
```

## 🚀 Iniciando Rápido

### Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar banco de dados
cp .env.example .env
# Editar .env com suas credenciais

# Executar migrações
npm run migrate

# Iniciar servidor
npm run dev

# Servidor rodando em http://localhost:3001
```

### Frontend Desktop

```bash
cd frontend-desktop

# Instalar dependências
npm install

# Iniciar desenvolvimento
npm run dev

# Abrir em http://localhost:5173
```

## 🔑 Credenciais de Teste

- **Email:** admin@montagex.com
- **Senha:** admin123

## ✨ Funcionalidades Principais

### ✅ Backend
- [x] Modelos de dados completos (13 tabelas)
- [x] Autenticação JWT
- [x] CRUD genérico
- [x] WebSocket para atualizações em tempo real
- [x] Sistema de configurações globais
- [x] Cálculo automático de salários
- [x] Sistema de porcentagem de repasse
- [x] API REST documentada

### ✅ Frontend Desktop
- [x] Login responsivo
- [x] Dashboard com métricas e gráficos
- [x] Menu lateral navigation
- [x] 8 seções principais
- [x] Design moderno e profissional
- [x] Theme (light/dark completo)
- [x] Modo offline com cache local (GET)
- [x] Sincronização automática de fila offline (POST/PUT/DELETE)
- [x] Autenticação protegida
- [x] Integração com API

### 🚧 Em Desenvolvimento
- [ ] Sistema de Relatórios (Desktop)
- [ ] Configurações (Desktop)
- [ ] CRUD/Telas de Novo Serviço (Mobile)
- [ ] CRUD/Telas de Equipes (Mobile)
- [ ] CRUD/Telas de Financeiro (Mobile)

## 📊 Tecnologias

### Backend
- **Node.js 18+**
- **Express 4.18+**
- **PostgreSQL**
- **Redis**
- **Socket.io 4.6+**
- **Sequelize 6.35+**
- **JWT**

### Frontend
- **React 18**
- **Vite 5**
- **React Router 6**
- **Recharts** (Gráficos)
- **Axios** (HTTP)
- **Electron 28** (Desktop)
- **Socket.io Client**

### Database
- **PostgreSQL** (Dados principais)
- **Redis** (Cache)
- **UUID** (Identificadores)

## 📚 Documentação

- **[Backend README](./backend/README.md)** - Documentação do backend
- **[Frontend README](./frontend-desktop/README.md)** - Documentação do frontend
- **[API Docs](./docs/API.md)** - Referência completa da API
- **[Arquitetura](./docs/ARQUITETURA.md)** - Stack técnico
- **[Sistema de Salários](./docs/SALARIOS-SISTEMA.md)** - Cálculo de salários
- **[Quick Start Frontend](./frontend-desktop/QUICK-START.md)** - Início rápido
- **[Development Guide](./frontend-desktop/DEVELOPMENT.md)** - Guia para desenvolvedores

## 🔄 Fluxo de Dados

### Autenticação
```
Login → POST /auth/login → JWT Token → Armazenar em localStorage
```

### Dashboard
```
Frontend → GET /dashboard → Backend retorna métricas → Exibe gráficos e cards
```

### WebSocket (Tempo real)
```
Usuario conecta → Servidor emite eventos → Todos recebem atualização em tempo real
Ex: Serviço concluído → Todos veem imediatamente
```

## 🗄️ Modelos de Dados

### Tabelas principais
1. **usuarios** - Admin e montadores
2. **lojas** - Clientes comerciais
3. **clientes_particulares** - Clientes residenciais
4. **produtos** - Móveis para montar
5. **servicos** - Serviços agendados/realizados
6. **servico_montadores** - Atribuição de montadores a serviços
7. **equipes** - Grupos de montadores
8. **rotas** - Planejamento diário
9. **recebimentos** - Pagamentos de clientes
10. **pagamentos_funcionarios** - Salários
11. **despesas** - Custos operacionais
12. **configuracoes** - Configurações do sistema
13. **Mais...**

Veja [schema.sql](./database/schema.sql) para detalhes completos.

## 💡 Diferenciais

- 🔐 **Seguro** - JWT, senhas com bcrypt, validações SQL
- ⚡ **Rápido** - Redis cache, otimização de queries
- 📱 **Responsivo** - Mobile-first design
- 🌍 **WebSocket** - Atualizações em tempo real
- 💰 **Profissional** - Cálculo de salários e comissões
- 📊 **Analytics** - Gráficos e relatórios
- 🎨 **Moderno** - UI/UX profissional
- 📖 **Documentado** - Código bem documentado

## 🤝 Contribuindo

Para contribuir com o projeto:

1. **Fork** o repositório
2. **Clone** seu fork: `git clone`
3. **Crie uma branch**: `git checkout -b feature/MinhaFeature`
4. **Commit** suas mudanças: `git commit -m 'Adiciona MinhaFeature'`
5. **Push** a branch: `git push origin feature/MinhaFeature`
6. **Abra um Pull Request**

## 📋 Requisitos do Sistema

- Node.js 18+
- npm 9+
- PostgreSQL 12+
- Redis 6+ (opcional, para cache)
- Git

## 🚀 Deploy

### Backend (Heroku/Railway)
```bash
cd backend
npm run build
# Enviar para plataforma
```

### Frontend (Vercel/Netlify)
```bash
cd frontend-desktop
npm run build
# Fazer deploy de dist/
```

### Desktop (Distribuição)
```bash
cd frontend-desktop
npm run electron-build
# Gera .exe / .dmg / .AppImage
```

## 📊 Performance

- ✅ SSR-ready
- ✅ Gzip compression
- ✅ Cache com Redis
- ✅ Lazy loading
- ✅ Code splitting
- ✅ Otimizado para produção

## 🔐 Segurança

- ✅ JWT tokens
- ✅ Bcrypt passwords
- ✅ SQL injection prevention (Sequelize)
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ Input validation
- ✅ HTTPS ready

## 📞 Suporte

- 📧 Email: suporte@montagex.com (futuro)
- 📖 Documentação: Veja `/docs`
- 🐛 Issues: GitHub issues

## 📄 Licença

Propripietary - Todos os direitos reservados

## 👥 Equipe

- **Backend:** Node.js + Express + PostgreSQL
- **Frontend:** React + Vite + Electron
- **Mobile:** React Native + Expo
- **DevOps:** Docker + CI/CD (planejado)

---

## 🎯 Roadmap

### v1.0 (Atual)
- ✅ Backend API completo
- ✅ Frontend Desktop base
- ✅ Autenticação
- ✅ Dashboard
- ✅ Sistema de salários

### v1.1 (1-2 meses)
- [ ] CRUD completo de todas as entidades
- [ ] Relatórios detalhados
- [x] Mobile app inicial

### v1.2
- [x] Modo offline (Desktop)
- [x] Sincronização automática (Desktop)
- [x] Dark mode completo

### v2.0
- [ ] AI/ML para otimização de rotas
- [ ] Integrações com sistemas terceiros
- [ ] API pública

---

**Desenvolvido com ❤️ para revolucionar a gestão de montagem**

Pronto para começar? Consulte os READMEs individuais! 🚀