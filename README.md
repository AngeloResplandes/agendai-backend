# AgendAI Backend

API Backend para o sistema de agendamento inteligente AgendAI, construída com **Hono** e **Cloudflare Workers**.

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=plastic&logo=cloudflareworkers&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-E36002?style=plastic&logo=hono&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-000000?style=plastic&logo=drizzle&logoColor=C5F74F)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=plastic&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=plastic&logo=nodedotjs&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=plastic&logo=zod&logoColor=white)

## Documentação

[Link para a documentação OpenAPI](https://agendai-backend.angeloresplandes.workers.dev)

## Índice

- [Visão Geral](#-visão-geral)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Executando](#-executando)
- [API Endpoints](#-api-endpoints)
- [Banco de Dados](#-banco-de-dados)
- [Agente IA](#-agente-ia)
- [Testes](#-testes)
- [Deploy](#-deploy)
- [Estrutura do Projeto](#-estrutura-do-projeto)

## Visão Geral

AgendAI é um sistema de agendamento de tarefas com um **assistente virtual inteligente** chamada **Lucy**. O backend oferece:

- **Autenticação JWT** completa com registro, login e recuperação de senha
- **CRUD de Tarefas** com prioridades, status e agendamento
- **Agente IA** (Lucy) que interpreta linguagem natural para gerenciar tarefas
- **Sistema de Roles** (free, pro, admin) com rotas administrativas
- **Documentação OpenAPI** automática com Swagger UI
- **Envio de emails** para recuperação de senha via Resend

## Tecnologias

| Tecnologia | Uso |
|------------|-----|
| [Hono](https://hono.dev/) | Framework web ultrarrápido |
| [Cloudflare Workers](https://workers.cloudflare.com/) | Runtime serverless na edge |
| [Cloudflare D1](https://developers.cloudflare.com/d1/) | Banco de dados SQLite serverless |
| [Drizzle ORM](https://orm.drizzle.team/) | ORM TypeScript type-safe |
| [Chanfana](https://github.com/cloudflare/chanfana) | OpenAPI automático para Hono |
| [Zod](https://zod.dev/) | Validação de schemas |
| [Groq](https://groq.com/) | LLM API (Llama 3.3 70B) |
| [Resend](https://resend.com/) | Envio de emails transacionais |

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare Edge                       │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Hono      │  │   Chanfana  │  │   Middlewares   │  │
│  │  (Router)   │  │  (OpenAPI)  │  │ (CORS, Auth...) │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│         │                │                   │           │
│  ┌──────▼─────────────────▼──────────────────▼────────┐  │
│  │                    Routes                           │  │
│  │  /api/auth/* │ /api/user/* │ /api/tasks/* │ /agent │  │
│  └──────────────────────┬─────────────────────────────┘  │
│                         │                                │
│  ┌──────────────────────▼─────────────────────────────┐  │
│  │                   Services                          │  │
│  │  user.ts │ task.ts │ groq.ts │ email.ts             │  │
│  └──────────────────────┬─────────────────────────────┘  │
│                         │                                │
│  ┌──────────────────────▼─────────────────────────────┐  │
│  │              Drizzle ORM + D1 Database              │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/agendai-backend.git
cd agendai-backend

# Instale as dependências
npm install
```

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.dev.vars` na raiz do projeto:

```env
JWT_SECRET=sua-chave-secreta-super-segura
GROQ_API_KEY=sua-api-key-do-groq
RESEND_API_KEY=sua-api-key-do-resend
```

### 2. Banco de Dados D1

```bash
# Crie o banco de dados D1 (primeira vez)
npx wrangler d1 create agendai-db

# Atualize o ID do banco no wrangler.jsonc
```

### 3. Migrações

```bash
# Gerar migrações a partir do schema
npm run generate

# Aplicar migrações localmente
npm run migrate

# Aplicar migrações em produção
npm run migrate:prod
```

## Executando

### Desenvolvimento Local

```bash
# Inicia o servidor de desenvolvimento
npm run dev

# Acesse: http://localhost:8787
```

### Desenvolvimento Remoto

```bash
# Usa o banco D1 de produção
npm run dev:remote
```

## API Endpoints

A documentação interativa está disponível em `/` (Swagger UI).

### Autenticação (`/api/auth`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/signup` | Criar conta |
| POST | `/api/auth/signin` | Login |
| POST | `/api/auth/forgot-password` | Solicitar reset de senha |
| POST | `/api/auth/validate-token` | Validar token de reset |
| POST | `/api/auth/reset-password` | Resetar senha |

### Usuário (`/api/user`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/user/me` | Obter perfil próprio |
| PUT | `/api/user/me` | Atualizar perfil próprio |
| DELETE | `/api/user/me` | Deletar conta própria |

### Admin (`/api/admin`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/admin/users/:userId` | Obter qualquer usuário |
| PUT | `/api/admin/users/:userId` | Atualizar qualquer usuário |
| DELETE | `/api/admin/users/:userId` | Deletar qualquer usuário |

### Tarefas (`/api/tasks`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/tasks` | Criar tarefa |
| GET | `/api/tasks` | Listar tarefas |
| GET | `/api/tasks/:taskId` | Obter tarefa |
| PUT | `/api/tasks/:taskId` | Atualizar tarefa |
| DELETE | `/api/tasks/:taskId` | Deletar tarefa |

### Agente IA (`/api/agent`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/agent/schedule` | Interagir com a Lucy |

Requer autenticação JWT

## Banco de Dados

### Schema

```typescript
// Usuários
user {
  id: UUID (PK)
  name: string
  email: string (unique)
  password: string (hash)
  role: "free" | "pro" | "admin"
  profilePhoto?: string
  coverPhoto?: string
  bio?: string
  createdAt: timestamp
  updatedAt: timestamp
}

// Tarefas
task {
  id: UUID (PK)
  userId: UUID (FK -> user)
  title: string
  description?: string
  scheduledDate?: string (YYYY-MM-DD)
  scheduledTime?: string (HH:MM)
  priority: "low" | "medium" | "high"
  status: "pending" | "in_progress" | "completed" | "cancelled"
  createdByAgent: boolean
  createdAt: timestamp
  updatedAt: timestamp
}

// Tokens de Reset de Senha
password_reset_token {
  id: UUID (PK)
  userId: UUID (FK -> user)
  token: string (6 dígitos)
  expiresAt: timestamp
  used: boolean
  createdAt: timestamp
}
```

## Agente IA

A **Lucy** é uma assistente virtual que interpreta linguagem natural para gerenciar tarefas.

### Exemplos de Interação

```
Usuário: "Agendar reunião com equipe amanhã às 14h"
Lucy: ✅ Agendei "Reunião com equipe" para amanhã às 14:00. Pode deixar que eu te lembro! 📅

Usuário: "Cancelar a reunião"
Lucy: 🗑️ Removi "Reunião com equipe" da sua agenda. Menos uma preocupação!

Usuário: "Quem é você?"
Lucy: Olá! 😊 Eu sou a Lucy, sua assistente virtual do AgendAI!
```

### Capacidades

- **Criar** tarefas com data, hora e prioridade
- **Atualizar** tarefas existentes (remarcar, mudar status)
- **Deletar** tarefas
- **Consultar** disponibilidade na agenda
- **Conversar** casualmente

## Testes

O projeto inclui um script de testes automatizados que valida todas as 17 rotas.

```bash
# Em um terminal, inicie o servidor
npm run dev

# Em outro terminal, execute os testes
npm run test

# Testar em produção
npm run test:prod
```

### Resultado Esperado

```
═══════════════════════════════════════════
  AgendAI - Script de Testes Automatizados
═══════════════════════════════════════════

✅ Passou:  14
❌ Falhou:  0
⏭️  Pulados: 3
📝 Total:   17

Taxa de sucesso: 100.0%

🎉 Todos os testes passaram!
```

## Deploy

### Deploy para Cloudflare Workers

```bash
# Deploy
npm run deploy

# Verificar build sem deploy
npx wrangler deploy --dry-run
```

### Secrets em Produção

```bash
# Configurar secrets
npx wrangler secret put JWT_SECRET
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put RESEND_API_KEY
```

## Estrutura do Projeto

```
agendai-backend/
├── src/
│   ├── config/
│   │   └── constants.ts      # Constantes centralizadas
│   ├── database/
│   │   ├── schema.ts         # Schema Drizzle
│   │   └── types.ts          # Tipos inferidos
│   ├── lib/
│   │   ├── context.ts        # Contexto de request
│   │   ├── drizzle.ts        # Factory Drizzle
│   │   ├── jwt.ts            # Criação de JWT
│   │   ├── logger.ts         # Logging estruturado
│   │   ├── password.ts       # Hash de senha (PBKDF2)
│   │   ├── response.ts       # Helpers de response
│   │   └── system-prompt.ts  # Prompt da Lucy
│   ├── middlewares/
│   │   └── auth.ts           # Autenticação JWT
│   ├── routes/
│   │   ├── auth/             # Rotas de autenticação
│   │   ├── user/             # Rotas de usuário
│   │   ├── tasks/            # Rotas de tarefas
│   │   ├── agent/            # Rota do agente IA
│   │   └── index.ts          # Registro de rotas
│   ├── schemas/
│   │   └── index.ts          # Schemas Zod/OpenAPI
│   ├── services/
│   │   ├── email.ts          # Envio de emails
│   │   ├── groq.ts           # Integração Groq
│   │   ├── passwordReset.ts  # Reset de senha
│   │   ├── task.ts           # CRUD tarefas
│   │   └── user.ts           # CRUD usuários
│   ├── types/
│   │   └── types.ts          # Tipos TypeScript
│   └── index.ts              # Entry point
├── drizzle/
│   └── migrations/           # Migrações SQL
├── .dev.vars                 # Variáveis locais (git ignored)
├── drizzle.config.ts         # Config Drizzle Kit
├── package.json
├── tsconfig.json
├── wrangler.jsonc            # Config Cloudflare Workers
└── README.md
```

## Scripts NPM

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento local |
| `npm run dev:remote` | Desenvolvimento com D1 remoto |
| `npm run deploy` | Deploy para produção |
| `npm run generate` | Gerar migrações Drizzle |
| `npm run migrate` | Aplicar migrações localmente |
| `npm run migrate:prod` | Aplicar migrações em produção |
| `npm run test` | Executar testes automatizados |
| `npm run test:prod` | Testes em produção |
| `npm run cf-typegen` | Gerar tipos do Cloudflare |

## Segurança

- **Senhas** hasheadas com PBKDF2 (100.000 iterações)
- **JWT** com expiração de 7 dias
- **CORS** configurado para origens específicas
- **Secure Headers** (X-Frame-Options, X-Content-Type-Options, etc.)
- **Validação** rigorosa de inputs com Zod
- **Token de reset** de 6 dígitos com expiração de 10 minutos