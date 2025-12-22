import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext, GroqAgentTask } from "../../types/types";
import { parseAgentRequest } from "../../services/groq";
import { createTask, findTaskByTitle, updateTask, deleteTask } from "../../services/task";
import { requireAuth, unauthorizedResponse } from "../../middlewares/auth";
import { TaskSchema, UnauthorizedResponse, BadRequestResponse, NotFoundResponse } from "../../schemas";

export class Schedule extends OpenAPIRoute {
    schema = {
        tags: ["Agent"],
        summary: "AI agent for task management (supports multiple tasks)",
        description: "Uses AI to interpret natural language and create, update or delete multiple tasks in a single request",
        security: [{ bearerAuth: [] }],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            message: Str({ example: "Agendar reunião amanhã às 14h e marcar dentista na sexta às 10h" }),
                        }),
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Actions completed successfully",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            results: z.array(z.object({
                                action: Str(),
                                success: z.boolean(),
                                task: TaskSchema.optional(),
                                interpretation: Str(),
                                error: Str().optional(),
                            })),
                            summary: Str(),
                        }),
                    },
                },
            },
            ...BadRequestResponse,
            ...UnauthorizedResponse,
            ...NotFoundResponse,
        },
    };

    async handle(c: AppContext) {
        const auth = await requireAuth(c);
        if (!auth) return unauthorizedResponse(c);

        const data = await this.getValidatedData<typeof this.schema>();
        const userMessage = data.body.message;

        const groqApiKey = (c.env as unknown as { GROQ_API_KEY?: string }).GROQ_API_KEY;
        if (!groqApiKey) {
            return c.json({ success: false, error: "GROQ_API_KEY não configurada" }, 500);
        }

        const result = await parseAgentRequest(groqApiKey, userMessage);

        if (result.success === false) {
            return c.json({ success: false, error: result.error }, 400);
        }

        const results: Array<{
            action: string;
            success: boolean;
            task?: unknown;
            interpretation: string;
            error?: string;
        }> = [];

        // Process each task
        for (let i = 0; i < result.data.tasks.length; i++) {
            const taskData = result.data.tasks[i];
            const interpretation = result.interpretations[i];

            try {
                const taskResult = await this.processTask(c, auth.userId, taskData);
                results.push({
                    action: taskData.action,
                    success: true,
                    task: taskResult,
                    interpretation,
                });
            } catch (error) {
                results.push({
                    action: taskData.action,
                    success: false,
                    interpretation,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        const summary = `${successCount}/${totalCount} tarefas processadas com sucesso`;

        return c.json({
            success: successCount === totalCount,
            results,
            summary,
        }, 200);
    }

    private async processTask(c: AppContext, userId: string, taskData: GroqAgentTask) {
        switch (taskData.action) {
            case "create": {
                if (!taskData.title) {
                    throw new Error("Título é obrigatório para criar tarefa");
                }

                return await createTask({
                    db: c.env.DB,
                    userId,
                    title: taskData.title,
                    description: taskData.description,
                    scheduledDate: taskData.scheduledDate,
                    scheduledTime: taskData.scheduledTime,
                    priority: taskData.priority,
                    createdByAgent: true,
                });
            }

            case "update": {
                if (!taskData.taskIdentifier) {
                    throw new Error("Identificador da tarefa é obrigatório");
                }

                const existingTask = await findTaskByTitle(c.env.DB, userId, taskData.taskIdentifier);
                if (!existingTask) {
                    throw new Error(`Tarefa "${taskData.taskIdentifier}" não encontrada`);
                }

                return await updateTask({
                    db: c.env.DB,
                    taskId: existingTask.id,
                    userId,
                    title: taskData.title || undefined,
                    description: taskData.description || undefined,
                    scheduledDate: taskData.scheduledDate || undefined,
                    scheduledTime: taskData.scheduledTime || undefined,
                    priority: taskData.priority || undefined,
                    status: taskData.status || undefined,
                });
            }

            case "delete": {
                if (!taskData.taskIdentifier) {
                    throw new Error("Identificador da tarefa é obrigatório");
                }

                const taskToDelete = await findTaskByTitle(c.env.DB, userId, taskData.taskIdentifier);
                if (!taskToDelete) {
                    throw new Error(`Tarefa "${taskData.taskIdentifier}" não encontrada`);
                }

                await deleteTask({
                    db: c.env.DB,
                    taskId: taskToDelete.id,
                    userId,
                });

                return { deleted: true, id: taskToDelete.id, title: taskToDelete.title };
            }

            default:
                throw new Error("Ação não reconhecida");
        }
    }
}
