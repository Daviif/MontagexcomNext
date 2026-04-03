# 🚀 Guia de Instalação - Sistema de Gestão de Montagem

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

### Obrigatório:
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 15+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

### Opcional:
- **Redis** - Para cache e sessões em tempo real
- **VS Code** - Editor recomendado

---

## 📦 Instalação Passo a Passo

### 1. Configurar o Banco de Dados PostgreSQL

#### Windows:
```cmd
# Abrir pgAdmin ou cmd
psql -U postgres

# Criar banco de dados
CREATE DATABASE sistema_montagem;

# Criar usuário (opcional)
CREATE USER montagem_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE sistema_montagem TO montagem_user;
```

#### Linux/Mac:
```bash
# Entrar no PostgreSQL
sudo -u postgres psql

# Criar banco de dados
CREATE DATABASE sistema_montagem;

# Criar usuário (opcional)
CREATE USER montagem_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE sistema_montagem TO montagem_user;
```

### 2. Executar o Schema do Banco

```bash
# Navegar até a pasta do projeto
cd sistema-montagem

# Executar o schema
psql -U postgres -d sistema_montagem -f database/schema.sql
```

### 3. Instalar Dependências do Backend

```bash
# Entrar na pasta do backend
cd backend

# Instalar dependências
npm install

# Copiar arquivo de configuração
cp .env.example .env
```

### 4. Configurar Variáveis de Ambiente

Edite o arquivo `backend/.env`:

```env
# Conexão com banco de dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistema_montagem
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

# Segurança JWT (IMPORTANTE: Gere uma chave única!)
JWT_SECRET=sua_chave_super_secreta_aqui_min_32_caracteres
JWT_REFRESH_SECRET=sua_chave_refresh_secreta_aqui

# Porta do servidor
PORT=3001
```

**⚠️ IMPORTANTE**: Gere chaves JWT seguras usando:
```bash
# Linux/Mac
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ou online: https://generate-secret.vercel.app/32
```

### 5. Iniciar o Backend

```bash
# Ainda na pasta backend
npm run dev
```

Você deverá ver:
```
🚀 Servidor rodando em http://localhost:3001
📡 WebSocket em http://localhost:3001/socket.io
🌍 Ambiente: development
```

### 6. Testar a API

Abra o navegador ou use curl:
```bash
# Testar health check
curl http://localhost:3001/health

# Ou abra no navegador
http://localhost:3001/api/v1/
```

---

## 🖥️ Instalação do Frontend Desktop (Electron)

### 1. Instalar Dependências

```bash
# Voltar à raiz e entrar no frontend
cd ../frontend-desktop
npm install
```

### 2. Configurar Ambiente

Crie `frontend-desktop/.env`:
```env
REACT_APP_API_URL=http://localhost:3001/api/v1
REACT_APP_WS_URL=http://localhost:3001
```

### 3. Iniciar em Modo Desenvolvimento

```bash
npm run dev
```

A aplicação desktop abrirá automaticamente!

---

## 📱 Instalação do App Mobile (React Native)

### Pré-requisitos Adicionais:

#### Para Android:
- Android Studio instalado
- Android SDK configurado
- JDK 11+ instalado

#### Para iOS (apenas Mac):
- Xcode instalado
- CocoaPods instalado

### 1. Instalar Dependências

```bash
cd ../mobile
npm install

# iOS apenas (Mac)
cd ios && pod install && cd ..
```

### 2. Configurar Ambiente

Crie `mobile/.env`:
```env
API_URL=http://seu-ip-local:3001/api/v1
WS_URL=http://seu-ip-local:3001
```

**Nota**: Use seu IP local (não localhost) para testar em dispositivos físicos.

### 3. Iniciar o App

#### Android:
```bash
npx react-native run-android
```

#### iOS (Mac):
```bash
npx react-native run-ios
```

---

## 🔧 Comandos Úteis

### Backend:
```bash
npm run dev          # Iniciar em desenvolvimento
npm start            # Iniciar em produção
npm run migrate      # Executar migrações
npm run seed         # Popular banco com dados teste
npm test             # Executar testes
```

### Frontend Desktop:
```bash
npm run dev          # Desenvolvimento
npm run build        # Build para produção
npm run package      # Criar executável
```

### Mobile:
```bash
npm start            # Iniciar Metro bundler
npm run android      # Rodar no Android
npm run ios          # Rodar no iOS
npm test             # Testes
```

---

## 🐛 Solução de Problemas

### Erro: "Cannot connect to database"
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo .env
- Teste a conexão: `psql -U postgres -d sistema_montagem`

### Erro: "Port 3001 already in use"
- Mude a porta no arquivo `.env`
- Ou mate o processo: `lsof -ti:3001 | xargs kill` (Linux/Mac)

### Erro: "JWT secret not defined"
- Configure a variável `JWT_SECRET` no `.env`
- Ela deve ter no mínimo 32 caracteres

### Frontend não conecta ao backend
- Verifique se o backend está rodando
- Confirme a URL da API no `.env` do frontend
- Verifique configuração de CORS no backend

### Mobile não conecta
- Use IP local ao invés de localhost
- Certifique-se que dispositivo está na mesma rede
- Para Android: `adb reverse tcp:3001 tcp:3001`

---

## 📊 Dados de Teste

Para popular o banco com dados de exemplo:

```bash
cd backend
npm run seed
```

**Usuário padrão:**
- Email: admin@sistema.com
- Senha: admin123

**⚠️ Mude a senha em produção!**

---

## 🚀 Deploy em Produção

### Backend (VPS/Cloud):

1. Clone o repositório no servidor
2. Configure as variáveis de ambiente
3. Instale dependências: `npm install --production`
4. Configure PM2 para manter rodando:
```bash
npm install -g pm2
pm2 start src/server.js --name "montagem-api"
pm2 startup
pm2 save
```

### Frontend Desktop:

```bash
npm run package
# Gera executável em /dist
```

Distribua o executável para os usuários.

### Mobile:

**Android:**
```bash
cd android
./gradlew assembleRelease
# APK em: android/app/build/outputs/apk/release/
```

**iOS:** Publique via Xcode → Archive → Distribute

---

## 📞 Suporte

Em caso de dúvidas:
1. Consulte a documentação em `/docs`
2. Verifique os logs do servidor
3. Abra uma issue no repositório

---

**Pronto! Sistema instalado e funcionando! 🎉**