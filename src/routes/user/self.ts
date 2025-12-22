import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types/types";
import { updateUser, findUserById, deleteUser } from "../../services/user";
import { requireAuth, unauthorizedResponse } from "../../middlewares/auth";
import { UserSchema, UserUpdateSchema, UnauthorizedResponse, NotFoundResponse } from "../../schemas";

export class GetSelf extends OpenAPIRoute {
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
                        schema: z.object({ user: UserSchema }),
                    },
                },
            },
            ...UnauthorizedResponse,
        },
    };

    async handle(c: AppContext) {
        const auth = await requireAuth(c);
        if (!auth) return unauthorizedResponse(c);

        const user = await findUserById(c.env.DB, auth.userId);
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

export class UpdateSelf extends OpenAPIRoute {
    schema = {
        tags: ["User"],
        summary: "Update own profile",
        description: "Allows authenticated user to update their own profile",
        security: [{ bearerAuth: [] }],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: UserUpdateSchema,
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
            ...UnauthorizedResponse,
        },
    };

    async handle(c: AppContext) {
        const auth = await requireAuth(c);
        if (!auth) return unauthorizedResponse(c);

        const data = await this.getValidatedData<typeof this.schema>();

        const user = await updateUser({
            db: c.env.DB,
            userId: auth.userId,
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

export class DeleteSelf extends OpenAPIRoute {
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
            ...UnauthorizedResponse,
        },
    };

    async handle(c: AppContext) {
        const auth = await requireAuth(c);
        if (!auth) return unauthorizedResponse(c);

        const deleted = await deleteUser({ db: c.env.DB, userId: auth.userId });

        if (!deleted) {
            return c.json({ error: "Usuário não encontrado" }, 404);
        }

        return { message: "Conta deletada com sucesso" };
    }
}
