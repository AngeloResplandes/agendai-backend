import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types/types";
import { findUserByEmail, createUser } from "../../services/user";

export class AuthSignUp extends OpenAPIRoute {
    schema = {
        tags: ["Auth"],
        summary: "User registration",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            name: Str({ example: "John Doe" }),
                            email: Str({ example: "user@example.com" }),
                            password: Str({ example: "password123" }),
                        }),
                    },
                },
            },
        },
        responses: {
            "201": {
                description: "User created successfully",
                content: {
                    "application/json": {
                        schema: z.object({
                            user: z.object({
                                id: Str(),
                                name: Str(),
                                email: Str(),
                            }),
                        }),
                    },
                },
            },
            "409": {
                description: "Email already in use",
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
        const { name, email, password } = data.body;

        const existingUser = await findUserByEmail(c.env.DB, email);
        if (existingUser) {
            return c.json({ error: "Email já está em uso" }, 409);
        }

        const user = await createUser({ db: c.env.DB, name, email, password });

        return c.json({ user }, 201);
    }
}
