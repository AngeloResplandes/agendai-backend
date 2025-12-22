import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types/types";
import { updateUser, deleteUser, findUserById } from "../../services/user";
import { requireAuth, unauthorizedResponse } from "../../middlewares/auth";
import { UserSchema, UnauthorizedResponse, NotFoundResponse } from "../../schemas";

// Helper para verificar admin
async function requireAdmin(c: AppContext) {
    const auth = await requireAuth(c);
    if (!auth) return { error: "auth" as const };

    const adminUser = await findUserById(c.env.DB, auth.userId);
    if (!adminUser || adminUser.role !== "admin") {
        return { error: "forbidden" as const };
    }
    return { userId: auth.userId };
}

const ForbiddenResponse = {
    "403": {
        description: "Forbidden",
        content: { "application/json": { schema: z.object({ error: Str() }) } },
    },
};

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
                        schema: z.object({ user: UserSchema }),
                    },
                },
            },
            ...UnauthorizedResponse,
            ...ForbiddenResponse,
            ...NotFoundResponse,
        },
    };

    async handle(c: AppContext) {
        const admin = await requireAdmin(c);
        if (admin.error === "auth") return unauthorizedResponse(c);
        if (admin.error === "forbidden") return c.json({ error: "Permissão insuficiente" }, 403);

        const data = await this.getValidatedData<typeof this.schema>();
        const user = await findUserById(c.env.DB, data.params.userId);

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
                            profilePhoto: Str({ required: false }),
                            coverPhoto: Str({ required: false }),
                            bio: z.string().max(100).optional(),
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
            ...UnauthorizedResponse,
            ...ForbiddenResponse,
            ...NotFoundResponse,
        },
    };

    async handle(c: AppContext) {
        const admin = await requireAdmin(c);
        if (admin.error === "auth") return unauthorizedResponse(c);
        if (admin.error === "forbidden") return c.json({ error: "Permissão insuficiente" }, 403);

        const data = await this.getValidatedData<typeof this.schema>();

        const user = await updateUser({
            db: c.env.DB,
            userId: data.params.userId,
            name: data.body.name,
            email: data.body.email,
            password: data.body.password,
            role: data.body.role,
            profilePhoto: data.body.profilePhoto,
            coverPhoto: data.body.coverPhoto,
            bio: data.body.bio,
        });

        if (!user) {
            return c.json({ error: "Usuário não encontrado" }, 404);
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
            ...UnauthorizedResponse,
            ...ForbiddenResponse,
            ...NotFoundResponse,
        },
    };

    async handle(c: AppContext) {
        const admin = await requireAdmin(c);
        if (admin.error === "auth") return unauthorizedResponse(c);
        if (admin.error === "forbidden") return c.json({ error: "Permissão insuficiente" }, 403);

        const data = await this.getValidatedData<typeof this.schema>();
        const deleted = await deleteUser({ db: c.env.DB, userId: data.params.userId });

        if (!deleted) {
            return c.json({ error: "Usuário não encontrado" }, 404);
        }

        return { message: "Usuário deletado com sucesso" };
    }
}
