import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types/types";
import { updateUser, findUserById, deleteUser } from "../../services/user";
import { verify } from "hono/jwt";
import type { JWTPayload } from "../../types/types";

export class UserGetSelf extends OpenAPIRoute {
    schema = {
        tags: ["User"],
        summary: "Get own profile",
        description: "Returns the authenticated user's profile data",
        security: [{ bearerAuth: [] }],
        responses: {
            "200": {
                description: "User profile",
                content: {
                    "application/json": {
                        schema: z.object({
                            user: z.object({
                                id: Str(),
                                name: Str(),
                                email: Str(),
                                role: Str(),
                                profilePhoto: Str().nullable(),
                                coverPhoto: Str().nullable(),
                                bio: Str().nullable(),
                                createdAt: Str(),
                            }),
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

        const decoded = await verify(token, c.env.JWT_SECRET) as JWTPayload;
        const user = await findUserById(c.env.DB, decoded.id);

        if (!user) {
            return c.json({ error: "Usuário não encontrado" }, 404);
        }

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePhoto: user.profilePhoto,
                coverPhoto: user.coverPhoto,
                bio: user.bio,
                createdAt: user.createdAt,
            }
        };
    }
}


export class UserUpdateSelf extends OpenAPIRoute {
    schema = {
        tags: ["User"],
        summary: "Update own profile",
        description: "Allows authenticated user to update their own profile",
        security: [{ bearerAuth: [] }],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            name: Str({ required: false, example: "New Name" }),
                            email: Str({ required: false, example: "new@example.com" }),
                            password: Str({ required: false, example: "newPassword123" }),
                            profilePhoto: Str({ required: false, example: "https://example.com/photo.jpg" }),
                            coverPhoto: Str({ required: false, example: "https://example.com/cover.jpg" }),
                            bio: z.string().max(100, "Bio must be at most 100 characters").optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Profile updated successfully",
                content: {
                    "application/json": {
                        schema: z.object({
                            user: z.object({
                                id: Str(),
                                name: Str(),
                                email: Str(),
                                role: Str(),
                                profilePhoto: Str().nullable(),
                                coverPhoto: Str().nullable(),
                                bio: Str().nullable(),
                            }),
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

        const decoded = await verify(token, c.env.JWT_SECRET) as JWTPayload;
        const data = await this.getValidatedData<typeof this.schema>();

        const user = await updateUser({
            db: c.env.DB,
            userId: decoded.id,
            name: data.body.name,
            email: data.body.email,
            password: data.body.password,
            profilePhoto: data.body.profilePhoto,
            coverPhoto: data.body.coverPhoto,
            bio: data.body.bio,
        });

        if (!user) {
            return c.json({ error: "Nenhum dado para atualizar" }, 400);
        }

        return { user };
    }
}

export class UserDeleteSelf extends OpenAPIRoute {
    schema = {
        tags: ["User"],
        summary: "Delete own account",
        description: "Allows authenticated user to delete their own account",
        security: [{ bearerAuth: [] }],
        responses: {
            "200": {
                description: "Account deleted successfully",
                content: {
                    "application/json": {
                        schema: z.object({ message: Str() }),
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

        const decoded = await verify(token, c.env.JWT_SECRET) as JWTPayload;

        const { deleteUser } = await import("../../services/user");
        const deleted = await deleteUser({ db: c.env.DB, userId: decoded.id });

        if (!deleted) {
            return c.json({ error: "Usuário não encontrado" }, 404);
        }

        return { message: "Conta deletada com sucesso" };
    }
}
