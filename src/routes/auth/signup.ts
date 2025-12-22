import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types/types";
import { createUser, findUserByEmail } from "../../services/user";
import { createJWT } from "../../lib/jwt";
import { RegisterSchema, TokenResponseSchema, BadRequestResponse } from "../../schemas";

export class SignUp extends OpenAPIRoute {
    schema = {
        tags: ["Auth"],
        summary: "User registration",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: RegisterSchema,
                    },
                },
            },
        },
        responses: {
            "201": {
                description: "Registration successful",
                content: {
                    "application/json": {
                        schema: TokenResponseSchema,
                    },
                },
            },
            ...BadRequestResponse,
        },
    };

    async handle(c: AppContext) {
        const data = await this.getValidatedData<typeof this.schema>();
        const { name, email, password } = data.body;

        const existingUser = await findUserByEmail(c.env.DB, email);
        if (existingUser) {
            return c.json({ error: "Email já cadastrado" }, 400);
        }

        const user = await createUser({ db: c.env.DB, name, email, password });
        const token = await createJWT(user.id, c.env.JWT_SECRET);

        return c.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        }, 201);
    }
}
