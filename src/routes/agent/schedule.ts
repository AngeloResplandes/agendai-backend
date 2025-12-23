import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext, GroqAgentTask } from "../../types/types";
import { parseAgentRequest, generateHumanizedInterpretation } from "../../services/groq";
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
                                error: Str().optional(),
                            })),
                            summary: Str(),
                            message: Str(),
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
            return c.json({
                success: false,
                error: result.error,
                message: `Desculpe ${auth.userName.split(" ")[0]}, não entendi o que você quer fazer. Pode reformular? 🤔`
            }, 400);
        }

        if ('isConversation' in result.data && result.data.isConversation === true) {
            return c.json({
                success: true,
                isConversation: true,
                message: result.data.message,
            }, 200);
        }

        const taskData = result.data;

        const results: Array<{
            action: string;
            success: boolean;
            task?: unknown;
            error?: string;
        }> = [];

        const interpretations: string[] = [];

        for (let i = 0; i < taskData.tasks.length; i++) {
            const task = taskData.tasks[i];

            try {
                const taskResult = await this.processTask(c, auth.userId, task);
                const interpretation = generateHumanizedInterpretation(task, auth.userName, true);
                interpretations.push(interpretation);
                results.push({
                    action: task.action,
                    success: true,
                    task: taskResult,
                });
            } catch (error) {
                const interpretation = generateHumanizedInterpretation(task, auth.userName, false);
                interpretations.push(interpretation);
                results.push({
                    action: task.action,
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        const firstName = auth.userName.split(" ")[0];

        let message: string;
        if (successCount === totalCount) {
            if (totalCount === 1) {
                message = interpretations[0];
            } else {
                message = `${firstName}, processei todas as ${totalCount} tarefas! 🎯 Sua agenda está atualizada.`;
            }
        } else if (successCount === 0) {
            message = `${firstName}, tive problemas com todas as tarefas. 😔 Pode tentar novamente?`;
        } else {
            message = `${firstName}, consegui processar ${successCount} de ${totalCount} tarefas. Algumas tiveram problemas.`;
        }

        return c.json({
            success: successCount === totalCount,
            results,
            summary: `${successCount}/${totalCount} tarefas processadas com sucesso`,
            message,
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
