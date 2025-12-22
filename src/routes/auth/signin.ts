import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types/types";
import { login } from "../../services/user";
import { createJWT } from "../../lib/jwt";
import { LoginSchema, TokenResponseSchema, UnauthorizedResponse } from "../../schemas";

export class SignIn extends OpenAPIRoute {
    schema = {
        tags: ["Auth"],
        summary: "User login",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: LoginSchema,
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Login successful",
                content: {
                    "application/json": {
                        schema: TokenResponseSchema,
                    },
                },
            },
            ...UnauthorizedResponse,
        },
    };

    async handle(c: AppContext) {
        const data = await this.getValidatedData<typeof this.schema>();
        const { email, password } = data.body;

        const user = await login({ db: c.env.DB, email, password });
        if (!user) {
            return c.json({ error: "Email ou senha inválidos" }, 401);
        }

        const token = await createJWT(user.id, c.env.JWT_SECRET);

        return {
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        };
    }
}
