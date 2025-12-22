import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types/types";
import { validatePasswordResetToken } from "../../services/passwordReset";
import { BadRequestResponse } from "../../schemas";

export class ValidateToken extends OpenAPIRoute {
    schema = {
        tags: ["Auth"],
        summary: "Validate password reset token",
        description: "Checks if the provided token is valid and not expired",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            email: Str({ example: "user@example.com" }),
                            token: Str({ example: "123456" }),
                        }),
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Token is valid",
                content: {
                    "application/json": {
                        schema: z.object({ valid: z.boolean() }),
                    },
                },
            },
            ...BadRequestResponse,
        },
    };

    async handle(c: AppContext) {
        const data = await this.getValidatedData<typeof this.schema>();
        const { email, token } = data.body;

        const result = await validatePasswordResetToken({ db: c.env.DB, email, token });

        if (!result.valid) {
            return c.json({ error: result.error }, 400);
        }

        return { valid: true };
    }
}
