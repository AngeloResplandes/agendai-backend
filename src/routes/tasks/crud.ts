import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types/types";
import { createTask, getTasksByUserId, getTaskById, updateTask, deleteTask } from "../../services/task";
import { requireAuth, unauthorizedResponse } from "../../middlewares/auth";
import {
    TaskSchema,
    TaskWithUpdatedAtSchema,
    TaskInputSchema,
    TaskUpdateSchema,
    UnauthorizedResponse,
    NotFoundResponse
} from "../../schemas";

export class Create extends OpenAPIRoute {
    schema = {
        tags: ["Tasks"],
        summary: "Create a new task",
        description: "Creates a new task for the authenticated user",
        security: [{ bearerAuth: [] }],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: TaskInputSchema,
                    },
                },
            },
        },
        responses: {
            "201": {
                description: "Task created successfully",
                content: {
                    "application/json": {
                        schema: z.object({ task: TaskSchema }),
                    },
                },
            },
            ...UnauthorizedResponse,
        },
    };

    async handle(c: AppContext) {
        const auth = await requireAuth(c);
        if (!auth) return unauthorizedResponse(c);

        const data = await this.getValidatedData<typeof this.schema>();

        const task = await createTask({
            db: c.env.DB,
            userId: auth.userId,
            title: data.body.title,
            description: data.body.description,
            scheduledDate: data.body.scheduledDate,
            scheduledTime: data.body.scheduledTime,
            priority: data.body.priority,
        });

        return c.json({ task }, 201);
    }
}

export class List extends OpenAPIRoute {
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
                            tasks: z.array(TaskWithUpdatedAtSchema),
                        }),
                    },
                },
            },
            ...UnauthorizedResponse,
        },
    };

    async handle(c: AppContext) {
        const auth = await requireAuth(c);
        if (!auth) return unauthorizedResponse(c);

        const tasks = await getTasksByUserId(c.env.DB, auth.userId);
        return { tasks };
    }
}

export class Get extends OpenAPIRoute {
    schema = {
        tags: ["Tasks"],
        summary: "Get a specific task",
        description: "Returns a specific task by ID",
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
                        schema: z.object({ task: TaskWithUpdatedAtSchema }),
                    },
                },
            },
            ...UnauthorizedResponse,
            ...NotFoundResponse,
        },
    };

    async handle(c: AppContext) {
        const auth = await requireAuth(c);
        if (!auth) return unauthorizedResponse(c);

        const data = await this.getValidatedData<typeof this.schema>();
        const task = await getTaskById(c.env.DB, data.params.taskId, auth.userId);

        if (!task) {
            return c.json({ error: "Tarefa não encontrada" }, 404);
        }

        return { task };
    }
}

export class Update extends OpenAPIRoute {
    schema = {
        tags: ["Tasks"],
        summary: "Update a task",
        description: "Updates a specific task",
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                taskId: Str({ example: "uuid-here" }),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: TaskUpdateSchema,
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Task updated successfully",
                content: {
                    "application/json": {
                        schema: z.object({ task: TaskWithUpdatedAtSchema }),
                    },
                },
            },
            ...UnauthorizedResponse,
            ...NotFoundResponse,
        },
    };

    async handle(c: AppContext) {
        const auth = await requireAuth(c);
        if (!auth) return unauthorizedResponse(c);

        const data = await this.getValidatedData<typeof this.schema>();

        const task = await updateTask({
            db: c.env.DB,
            taskId: data.params.taskId,
            userId: auth.userId,
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

export class Delete extends OpenAPIRoute {
    schema = {
        tags: ["Tasks"],
        summary: "Delete a task",
        description: "Deletes a specific task",
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
            ...UnauthorizedResponse,
            ...NotFoundResponse,
        },
    };

    async handle(c: AppContext) {
        const auth = await requireAuth(c);
        if (!auth) return unauthorizedResponse(c);

        const data = await this.getValidatedData<typeof this.schema>();

        const deleted = await deleteTask({
            db: c.env.DB,
            taskId: data.params.taskId,
            userId: auth.userId,
        });

        if (!deleted) {
            return c.json({ error: "Tarefa não encontrada" }, 404);
        }

        return { message: "Tarefa deletada com sucesso" };
    }
}
