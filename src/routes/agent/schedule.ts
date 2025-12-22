import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types/types";
import { parseScheduleRequest } from "../../services/groq";
import { createTask } from "../../services/task";
import { requireAuth, unauthorizedResponse } from "../../middlewares/auth";
import { TaskSchema, UnauthorizedResponse, BadRequestResponse } from "../../schemas";

export class Schedule extends OpenAPIRoute {
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
                            task: TaskSchema,
                            interpretation: Str(),
                        }),
                    },
                },
            },
            ...BadRequestResponse,
            ...UnauthorizedResponse,
        },
    };

    async handle(c: AppContext) {
        const auth = await requireAuth(c);
        if (!auth) return unauthorizedResponse(c);

        const data = await this.getValidatedData<typeof this.schema>();
        const userMessage = data.body.message;

        // Get Groq API key
        const groqApiKey = (c.env as unknown as { GROQ_API_KEY?: string }).GROQ_API_KEY;
        if (!groqApiKey) {
            return c.json({ success: false, error: "GROQ_API_KEY não configurada" }, 500);
        }

        // Parse the natural language request using Groq
        const result = await parseScheduleRequest(groqApiKey, userMessage);

        if (result.success === false) {
            return c.json({ success: false, error: result.error }, 400);
        }

        // Create the task with the parsed data
        const task = await createTask({
            db: c.env.DB,
            userId: auth.userId,
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
