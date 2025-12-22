# AgendAI - Documentação da API de Tarefas

## Visão Geral

Esta documentação descreve as rotas de API para o gerenciamento de tarefas e o agente de IA para agendamento automático.

## Autenticação

Todas as rotas requerem autenticação via Bearer Token JWT.

```
Authorization: Bearer <seu_token>
```

---

## Rotas de Tarefas

### Criar Tarefa

`POST /api/tasks`

**Request Body:**
```json
{
  "title": "Reunião com equipe",
  "description": "Discutir planejamento do projeto",
  "scheduledDate": "2025-12-25",
  "scheduledTime": "14:00",
  "priority": "high"
}
```

**Response (201):**
```json
{
  "task": {
    "id": "uuid",
    "title": "Reunião com equipe",
    "description": "Discutir planejamento do projeto",
    "scheduledDate": "2025-12-25",
    "scheduledTime": "14:00",
    "priority": "high",
    "status": "pending",
    "createdByAgent": false,
    "createdAt": "2025-12-22T15:00:00.000Z"
  }
}
```

---

### Listar Tarefas

`GET /api/tasks`

**Response (200):**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Reunião com equipe",
      "description": "Discutir planejamento",
      "scheduledDate": "2025-12-25",
      "scheduledTime": "14:00",
      "priority": "high",
      "status": "pending",
      "createdByAgent": false,
      "createdAt": "2025-12-22T15:00:00.000Z",
      "updatedAt": "2025-12-22T15:00:00.000Z"
    }
  ]
}
```

---

### Obter Tarefa

`GET /api/tasks/:taskId`

**Response (200):**
```json
{
  "task": {
    "id": "uuid",
    "title": "Reunião com equipe",
    ...
  }
}
```

---

### Atualizar Tarefa

`PUT /api/tasks/:taskId`

**Request Body:**
```json
{
  "title": "Novo título",
  "status": "completed",
  "priority": "low"
}
```

**Status disponíveis:** `pending`, `in_progress`, `completed`, `cancelled`

**Prioridades:** `low`, `medium`, `high`

---

### Deletar Tarefa

`DELETE /api/tasks/:taskId`

**Response (200):**
```json
{
  "message": "Tarefa deletada com sucesso"
}
```

---

## Agente de IA

### Agendar via Linguagem Natural

`POST /api/agent/schedule`

O agente de IA interpreta mensagens em linguagem natural e cria tarefas automaticamente.

**Request Body:**
```json
{
  "message": "Agendar reunião com equipe amanhã às 14h"
}
```

**Response (201):**
```json
{
  "success": true,
  "task": {
    "id": "uuid",
    "title": "Reunião com equipe",
    "description": null,
    "scheduledDate": "2025-12-23",
    "scheduledTime": "14:00",
    "priority": "medium",
    "status": "pending",
    "createdByAgent": true,
    "createdAt": "2025-12-22T15:00:00.000Z"
  },
  "interpretation": "Criei a tarefa \"Reunião com equipe\" para 2025-12-23 às 14:00"
}
```

**Exemplos de mensagens suportadas:**
- "Agendar dentista para sexta às 10h"
- "Reunião importante com cliente amanhã de manhã"
- "Lembrar de enviar relatório semana que vem"
- "Marcar consulta médica dia 25 às 15:30 - urgente"

---

## Modelo de Dados

### Task (Tarefa)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | UUID único |
| `userId` | string | ID do usuário proprietário |
| `title` | string | Título da tarefa (obrigatório) |
| `description` | string | Descrição detalhada |
| `scheduledDate` | string | Data (YYYY-MM-DD) |
| `scheduledTime` | string | Hora (HH:MM) |
| `priority` | string | low, medium, high |
| `status` | string | pending, in_progress, completed, cancelled |
| `createdByAgent` | boolean | Se foi criada pelo agente de IA |
| `createdAt` | string | Data de criação |
| `updatedAt` | string | Data de atualização |

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Requisição inválida ou falha ao interpretar |
| 401 | Token inválido ou ausente |
| 404 | Tarefa não encontrada |
| 500 | Erro interno do servidor |
