import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext, JWTPayload } from "../../types/types";
import { createTask, getTasksByUserId, getTaskById, updateTask, deleteTask } from "../../services/task";
import { verify } from "hono/jwt";

// Helper function to extract user ID from JWT
async function getUserIdFromToken(c: AppContext): Promise<string | null> {
    const authHeader = c.req.header("authorization");
    if (!authHeader) return null;

    const token = authHeader.split(" ")[1];
    if (!token) return null;

    try {
        const decoded = await verify(token, c.env.JWT_SECRET) as JWTPayload;
        return decoded.id;
    } catch {
        return null;
    }
}

export class TaskCreate extends OpenAPIRoute {
    schema = {
        tags: ["Tasks"],
        summary: "Create a new task",
        description: "Creates a new task for the authenticated user",
        security: [{ bearerAuth: [] }],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            title: Str({ example: "Reunião com equipe" }),
                            description: Str({ required: false, example: "Discutir planejamento do projeto" }),
                            scheduledDate: Str({ required: false, example: "2025-12-25" }),
                            scheduledTime: Str({ required: false, example: "14:00" }),
                            priority: z.enum(["low", "medium", "high"]).optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            "201": {
                description: "Task created successfully",
                content: {
                    "application/json": {
                        schema: z.object({
                            task: z.object({
                                id: Str(),
                                title: Str(),
                                description: Str().nullable(),
                                scheduledDate: Str().nullable(),
                                scheduledTime: Str().nullable(),
                                priority: Str(),
                                status: Str(),
                                createdByAgent: z.boolean(),
                                createdAt: Str(),
                            }),
                        }),
                    },
                },
            },
            "401": {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: z.object({ error: Str() }),
                    },
                },
            },
        },
    };

    async handle(c: AppContext) {
        const userId = await getUserIdFromToken(c);
        if (!userId) {
            return c.json({ error: "Acesso negado" }, 401);
        }

        const data = await this.getValidatedData<typeof this.schema>();

        const task = await createTask({
            db: c.env.DB,
            userId,
            title: data.body.title,
            description: data.body.description,
            scheduledDate: data.body.scheduledDate,
            scheduledTime: data.body.scheduledTime,
            priority: data.body.priority,
        });

        return c.json({ task }, 201);
    }
}

export class TaskList extends OpenAPIRoute {
    schema = {
        tags: ["Tasks"],
        summary: "List all tasks",
        description: "Returns all tasks for the authenticated user",
        security: [{ bearerAuth: [] }],
        responses: {
            "200": {
                description: "List of tasks",
                content: {
                    "application/json": {
                        schema: z.object({
                            tasks: z.array(z.object({
                                id: Str(),
                                title: Str(),
                                description: Str().nullable(),
                                scheduledDate: Str().nullable(),
                                scheduledTime: Str().nullable(),
                                priority: Str(),
                                status: Str(),
                                createdByAgent: z.boolean(),
                                createdAt: Str(),
                                updatedAt: Str(),
                            })),
                        }),
                    },
                },
            },
            "401": {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: z.object({ error: Str() }),
                    },
                },
            },
        },
    };

    async handle(c: AppContext) {
        const userId = await getUserIdFromToken(c);
        if (!userId) {
            return c.json({ error: "Acesso negado" }, 401);
        }

        const tasks = await getTasksByUserId(c.env.DB, userId);
        return { tasks };
    }
}

export class TaskGet extends OpenAPIRoute {
    schema = {
        tags: ["Tasks"],
        summary: "Get a specific task",
        description: "Returns a specific task by ID for the authenticated user",
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                taskId: Str({ example: "uuid-here" }),
            }),
        },
        responses: {
            "200": {
                description: "Task details",
                content: {
                    "application/json": {
                        schema: z.object({
                            task: z.object({
                                id: Str(),
                                title: Str(),
                                description: Str().nullable(),
                                scheduledDate: Str().nullable(),
                                scheduledTime: Str().nullable(),
                                priority: Str(),
                                status: Str(),
                                createdByAgent: z.boolean(),
                                createdAt: Str(),
                                updatedAt: Str(),
                            }),
                        }),
                    },
                },
            },
            "401": {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: z.object({ error: Str() }),
                    },
                },
            },
            "404": {
                description: "Task not found",
                content: {
                    "application/json": {
                        schema: z.object({ error: Str() }),
                    },
                },
            },
        },
    };

    async handle(c: AppContext) {
        const userId = await getUserIdFromToken(c);
        if (!userId) {
            return c.json({ error: "Acesso negado" }, 401);
        }

        const data = await this.getValidatedData<typeof this.schema>();
        const task = await getTaskById(c.env.DB, data.params.taskId, userId);

        if (!task) {
            return c.json({ error: "Tarefa não encontrada" }, 404);
        }

        return { task };
    }
}

export class TaskUpdate extends OpenAPIRoute {
    schema = {
        tags: ["Tasks"],
        summary: "Update a task",
        description: "Updates a specific task for the authenticated user",
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                taskId: Str({ example: "uuid-here" }),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            title: Str({ required: false, example: "Novo título" }),
                            description: Str({ required: false, example: "Nova descrição" }),
                            scheduledDate: Str({ required: false, example: "2025-12-26" }),
                            scheduledTime: Str({ required: false, example: "15:00" }),
                            priority: z.enum(["low", "medium", "high"]).optional(),
                            status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Task updated successfully",
                content: {
                    "application/json": {
                        schema: z.object({
                            task: z.object({
                                id: Str(),
                                title: Str(),
                                description: Str().nullable(),
                                scheduledDate: Str().nullable(),
                                scheduledTime: Str().nullable(),
                                priority: Str(),
                                status: Str(),
                                createdByAgent: z.boolean(),
                                createdAt: Str(),
                                updatedAt: Str(),
                            }),
                        }),
                    },
                },
            },
            "401": {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: z.object({ error: Str() }),
                    },
                },
            },
            "404": {
                description: "Task not found",
                content: {
                    "application/json": {
                        schema: z.object({ error: Str() }),
                    },
                },
            },
        },
    };

    async handle(c: AppContext) {
        const userId = await getUserIdFromToken(c);
        if (!userId) {
            return c.json({ error: "Acesso negado" }, 401);
        }

        const data = await this.getValidatedData<typeof this.schema>();

        const task = await updateTask({
            db: c.env.DB,
            taskId: data.params.taskId,
            userId,
            title: data.body.title,
            description: data.body.description,
            scheduledDate: data.body.scheduledDate,
            scheduledTime: data.body.scheduledTime,
            priority: data.body.priority,
            status: data.body.status,
        });

        if (!task) {
            return c.json({ error: "Tarefa não encontrada" }, 404);
        }

        return { task };
    }
}

export class TaskDelete extends OpenAPIRoute {
    schema = {
        tags: ["Tasks"],
        summary: "Delete a task",
        description: "Deletes a specific task for the authenticated user",
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                taskId: Str({ example: "uuid-here" }),
            }),
        },
        responses: {
            "200": {
                description: "Task deleted successfully",
                content: {
                    "application/json": {
                        schema: z.object({ message: Str() }),
                    },
                },
            },
            "401": {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: z.object({ error: Str() }),
                    },
                },
            },
            "404": {
                description: "Task not found",
                content: {
                    "application/json": {
                        schema: z.object({ error: Str() }),
                    },
                },
            },
        },
    };

    async handle(c: AppContext) {
        const userId = await getUserIdFromToken(c);
        if (!userId) {
            return c.json({ error: "Acesso negado" }, 401);
        }

        const data = await this.getValidatedData<typeof this.schema>();

        const deleted = await deleteTask({
            db: c.env.DB,
            taskId: data.params.taskId,
            userId,
        });

        if (!deleted) {
            return c.json({ error: "Tarefa não encontrada" }, 404);
        }

        return { message: "Tarefa deletada com sucesso" };
    }
}
