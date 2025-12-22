import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types/types";
import { resetPassword } from "../../services/passwordReset";

export class ResetPassword extends OpenAPIRoute {
    schema = {
        tags: ["Auth"],
        summary: "Reset password with token",
        description: "Resets the user password after validating the token",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            email: Str({ example: "user@example.com" }),
                            token: Str({ example: "123456" }),
                            newPassword: Str({ example: "newPassword123" }),
                        }),
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Password reset successfully",
                content: {
                    "application/json": {
                        schema: z.object({
                            message: Str(),
                        }),
                    },
                },
            },
            "400": {
                description: "Token is invalid or expired",
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
        const { email, token, newPassword } = data.body;

        const result = await resetPassword({ db: c.env.DB, email, token, newPassword });

        if (!result.success) {
            return c.json({ error: result.error }, 400);
        }

        return { message: "Senha alterada com sucesso" };
    }
}
