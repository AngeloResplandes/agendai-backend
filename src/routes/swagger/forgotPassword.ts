import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types/types";
import { createPasswordResetToken } from "../../services/passwordReset";
import { sendPasswordResetEmail } from "../../services/email";

export class ForgotPassword extends OpenAPIRoute {
    schema = {
        tags: ["Auth"],
        summary: "Request password reset token",
        description: "Generates a 6-digit token valid for 10 minutes and sends it via email",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            email: Str({ example: "user@example.com" }),
                        }),
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Token sent via email",
                content: {
                    "application/json": {
                        schema: z.object({
                            message: Str(),
                            expiresIn: z.number(),
                        }),
                    },
                },
            },
            "404": {
                description: "Email not found",
                content: {
                    "application/json": {
                        schema: z.object({
                            error: Str(),
                        }),
                    },
                },
            },
            "500": {
                description: "Failed to send email",
                content: {
                    "application/json": {
                        schema: z.object({
                            error: Str(),
                        }),
                    },
                },
            },
        },
    };

    async handle(c: AppContext) {
        const data = await this.getValidatedData<typeof this.schema>();
        const { email } = data.body;

        const result = await createPasswordResetToken({ db: c.env.DB, email });

        if (!result) {
            return c.json({ error: "Email não encontrado" }, 404);
        }

        const emailResult = await sendPasswordResetEmail(
            c.env.RESEND_API_KEY,
            c.env.EMAIL_FROM,
            result.userEmail,
            result.token,
            result.userName
        );

        if (!emailResult.success) {
            return c.json({ error: "Falha ao enviar email: " + emailResult.error }, 500);
        }

        return {
            message: "Token de recuperação enviado para seu email",
            expiresIn: 600,
        };
    }
}

