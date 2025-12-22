import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext, JWTPayload } from "../../types/types";
import { parseScheduleRequest } from "../../services/groq";
import { createTask } from "../../services/task";
import { verify } from "hono/jwt";

export class AgentSchedule extends OpenAPIRoute {
    schema = {
        tags: ["Agent"],
        summary: "Schedule task via AI agent",
        description: "Uses AI to interpret natural language and create a scheduled task",
        security: [{ bearerAuth: [] }],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            message: Str({ example: "Agendar reunião com equipe amanhã às 14h" }),
                        }),
                    },
                },
            },
        },
        responses: {
            "201": {
                description: "Task created successfully via AI",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
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
                            interpretation: Str(),
                        }),
                    },
                },
            },
            "400": {
                description: "Failed to interpret request",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            error: Str(),
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
        const authHeader = c.req.header("authorization");
        if (!authHeader) {
            return c.json({ error: "Acesso negado" }, 401);
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return c.json({ error: "Acesso negado" }, 401);
        }

        let userId: string;
        try {
            const decoded = await verify(token, c.env.JWT_SECRET) as JWTPayload;
            userId = decoded.id;
        } catch {
            return c.json({ error: "Token inválido" }, 401);
        }

        const data = await this.getValidatedData<typeof this.schema>();
        const userMessage = data.body.message;

        // Parse the natural language request using Groq
        const groqApiKey = (c.env as unknown as { GROQ_API_KEY?: string }).GROQ_API_KEY;
        if (!groqApiKey) {
            return c.json({ success: false, error: "GROQ_API_KEY não configurada" }, 500);
        }

        const result = await parseScheduleRequest(groqApiKey, userMessage);

        if (result.success === false) {
            return c.json({ success: false, error: result.error }, 400);
        }

        // Create the task with the parsed data
        const task = await createTask({
            db: c.env.DB,
            userId,
            title: result.data.title,
            description: result.data.description,
            scheduledDate: result.data.scheduledDate,
            scheduledTime: result.data.scheduledTime,
            priority: result.data.priority,
            createdByAgent: true,
        });

        return c.json({
            success: true,
            task,
            interpretation: result.interpretation,
        }, 201);
    }
}
