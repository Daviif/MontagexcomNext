# Montagex - Sistema de Gestao de Montagem de Moveis

Sistema completo para operacao de montagem de moveis: agendamento, equipe, financeiro, rotas, salarios e relatorios.

## Visao Geral

O Montagex ajuda empresas de montagem a:
- Agendar e acompanhar servicos (lojas e particulares)
- Gerenciar montadores e equipes
- Controlar recebimentos, pagamentos e despesas
- Visualizar indicadores e relatorios operacionais/financeiros

## Arquitetura

- Frontend Web: Next.js + React + TypeScript + Tailwind CSS
- Backend API: Node.js + Express + Sequelize
- Banco de dados: PostgreSQL
- Cache/tempo real: Redis + Socket.IO

## Estrutura Atual do Repositorio

```text
Montagex-Copia/
|- backend/                  # API (Node/Express)
|  |- src/
|  |  |- models/             # Modelos Sequelize
|  |  |- routes/             # Endpoints REST
|  |  |- middleware/         # Auth, permissoes, etc.
|  |  |- database/           # Migracoes/seeds/scripts
|  |  |- utils/
|  |  |- validators/
|  |  |- app.js
|  |  \- server.js
|  \- package.json
|
|- frontend/                 # App principal (Next.js)
|  |- src/
|  |  |- app/                # App Router (paginas/layouts)
|  |  |- components/         # UI e features
|  |  |- lib/                # Tipos e utilitarios
|  |  |- hooks/
|  |  \- services/           # Cliente HTTP
|  \- package.json
|
|- front1/                   # Outra base Next.js (apoio/prototipo)
|- database/                 # schema.sql e migracoes SQL
|- docs/                     # Documentacao funcional/tecnica
\- README.md
```

## Tecnologias em Uso

### Backend
- Node.js >= 18
- Express 4.18
- Sequelize 6.35
- PostgreSQL (`pg`, `pg-hstore`)
- Redis 4.6
- Socket.IO 4.6
- JWT (`jsonwebtoken`), `bcryptjs`
- Seguranca: `helmet`, `cors`, `express-rate-limit`
- Uploads: `multer`

### Frontend (app principal em `frontend/`)
- Next.js 16.2
- React 19.2
- TypeScript 5
- Tailwind CSS v4
- Radix UI + shadcn/ui
- Recharts (graficos)
- Axios (HTTP)
- Sonner (toasts)
- Lucide React (icones)

## Como Rodar Localmente

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env
# ajustar variaveis do .env (Postgres/Redis/JWT)
npm run migrate
npm run dev
```

API padrao: `http://localhost:3000` (ou conforme `.env`).

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`.

## Scripts Principais

### Backend (`backend/package.json`)
- `npm run dev` -> sobe API com nodemon
- `npm run start` -> sobe API em producao
- `npm run migrate` -> executa migracoes
- `npm run seed` -> executa seeds
- `npm test` -> testes com Jest

### Frontend (`frontend/package.json`)
- `npm run dev` -> Next dev na porta 5173
- `npm run build` -> build de producao
- `npm run start` -> servidor Next de producao
- `npm run lint` -> lint do frontend

## Funcionalidades Implementadas

- Autenticacao JWT
- Dashboard operacional e financeiro
- Gestao de OS, clientes, lojas, produtos, equipes e montadores
- Modulo financeiro: salarios, pagamentos, despesas
- Baixas de pagamentos com fluxo de criacao automatica de lancamento quando necessario
- Relatorios (custos, lucro, producao, mensal, loja/cliente e produto)

## Documentacao

- `docs/API.md`
- `docs/ARQUITETURA.md`
- `docs/SALARIOS-SISTEMA.md`
- `docs/SISTEMA-RECALCULO-COMPLETO.md`

## Requisitos

- Node.js 18+
- npm 9+
- PostgreSQL 12+
- Redis 6+ (recomendado)

## Licenca

Uso proprietario (conforme politicas do projeto).
