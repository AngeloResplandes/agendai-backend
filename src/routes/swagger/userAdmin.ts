import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types/types";
import { updateUser, deleteUser, findUserById } from "../../services/user";
import { verify } from "hono/jwt";
import type { JWTPayload } from "../../types/types";

export class AdminGetUser extends OpenAPIRoute {
    schema = {
        tags: ["Admin"],
        summary: "Get any user (Admin only)",
        description: "Allows admin to view any user's profile",
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                userId: Str({ example: "user-uuid" }),
            }),
        },
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
            "401": { description: "Unauthorized", content: { "application/json": { schema: z.object({ error: Str() }) } } },
            "403": { description: "Forbidden", content: { "application/json": { schema: z.object({ error: Str() }) } } },
            "404": { description: "User not found", content: { "application/json": { schema: z.object({ error: Str() }) } } },
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

        const adminUser = await findUserById(c.env.DB, decoded.id);
        if (!adminUser || adminUser.role !== "admin") {
            return c.json({ error: "Permissão insuficiente" }, 403);
        }

        const data = await this.getValidatedData<typeof this.schema>();
        const { userId } = data.params;

        const user = await findUserById(c.env.DB, userId);
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


export class AdminUpdateUser extends OpenAPIRoute {
    schema = {
        tags: ["Admin"],
        summary: "Update any user (Admin only)",
        description: "Allows admin to update any user's profile including role",
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                userId: Str({ example: "user-uuid" }),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            name: Str({ required: false, example: "New Name" }),
                            email: Str({ required: false, example: "new@example.com" }),
                            password: Str({ required: false, example: "newPassword123" }),
                            role: z.enum(["free", "pro", "admin"]).optional(),
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
                description: "User updated successfully",
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
            "401": { description: "Unauthorized", content: { "application/json": { schema: z.object({ error: Str() }) } } },
            "403": { description: "Forbidden", content: { "application/json": { schema: z.object({ error: Str() }) } } },
            "404": { description: "User not found", content: { "application/json": { schema: z.object({ error: Str() }) } } },
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

        const adminUser = await findUserById(c.env.DB, decoded.id);
        if (!adminUser || adminUser.role !== "admin") {
            return c.json({ error: "Permissão insuficiente" }, 403);
        }

        const data = await this.getValidatedData<typeof this.schema>();
        const { userId } = data.params;

        const user = await updateUser({
            db: c.env.DB,
            userId,
            name: data.body.name,
            email: data.body.email,
            password: data.body.password,
            role: data.body.role,
            profilePhoto: data.body.profilePhoto,
            coverPhoto: data.body.coverPhoto,
            bio: data.body.bio,
        });

        if (!user) {
            return c.json({ error: "Usuário não encontrado ou nenhum dado para atualizar" }, 404);
        }

        return { user };
    }
}

export class AdminDeleteUser extends OpenAPIRoute {
    schema = {
        tags: ["Admin"],
        summary: "Delete any user (Admin only)",
        description: "Allows admin to delete any user",
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                userId: Str({ example: "user-uuid" }),
            }),
        },
        responses: {
            "200": {
                description: "User deleted successfully",
                content: {
                    "application/json": {
                        schema: z.object({ message: Str() }),
                    },
                },
            },
            "401": { description: "Unauthorized", content: { "application/json": { schema: z.object({ error: Str() }) } } },
            "403": { description: "Forbidden", content: { "application/json": { schema: z.object({ error: Str() }) } } },
            "404": { description: "User not found", content: { "application/json": { schema: z.object({ error: Str() }) } } },
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

        const adminUser = await findUserById(c.env.DB, decoded.id);
        if (!adminUser || adminUser.role !== "admin") {
            return c.json({ error: "Permissão insuficiente" }, 403);
        }

        const data = await this.getValidatedData<typeof this.schema>();
        const { userId } = data.params;

        const deleted = await deleteUser({ db: c.env.DB, userId });

        if (!deleted) {
            return c.json({ error: "Usuário não encontrado" }, 404);
        }

        return { message: "Usuário deletado com sucesso" };
    }
}
