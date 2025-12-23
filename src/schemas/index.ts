import { Str } from "chanfana";
import { z } from "zod";

export const ErrorSchema = z.object({ error: Str() });

export const UnauthorizedResponse = {
    "401": {
        description: "Unauthorized",
        content: {
            "application/json": {
                schema: ErrorSchema,
            },
        },
    },
};

export const NotFoundResponse = {
    "404": {
        description: "Not found",
        content: {
            "application/json": {
                schema: ErrorSchema,
            },
        },
    },
};

export const BadRequestResponse = {
    "400": {
        description: "Bad request",
        content: {
            "application/json": {
                schema: ErrorSchema,
            },
        },
    },
};

export const TaskSchema = z.object({
    id: Str(),
    title: Str(),
    description: Str().nullable(),
    scheduledDate: Str().nullable(),
    scheduledTime: Str().nullable(),
    priority: Str(),
    status: Str(),
    createdByAgent: z.boolean(),
    createdAt: Str(),
});

export const TaskWithUpdatedAtSchema = TaskSchema.extend({
    updatedAt: Str(),
});

export const TaskInputSchema = z.object({
    title: Str({ example: "Reunião com equipe" }),
    description: Str({ required: false, example: "Discutir planejamento" }),
    scheduledDate: Str({ required: false, example: "2025-12-25" }),
    scheduledTime: Str({ required: false, example: "14:00" }),
    priority: z.enum(["low", "medium", "high"]).optional(),
});

export const TaskUpdateSchema = z.object({
    title: Str({ required: false, example: "Novo título" }),
    description: Str({ required: false, example: "Nova descrição" }),
    scheduledDate: Str({ required: false, example: "2025-12-26" }),
    scheduledTime: Str({ required: false, example: "15:00" }),
    priority: z.enum(["low", "medium", "high"]).optional(),
    status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
});

export const UserSchema = z.object({
    id: Str(),
    name: Str(),
    email: Str(),
    role: Str(),
    profilePhoto: Str().nullable(),
    coverPhoto: Str().nullable(),
    bio: Str().nullable(),
    createdAt: Str(),
});

export const UserUpdateSchema = z.object({
    name: Str({ required: false, example: "New Name" }),
    email: Str({ required: false, example: "new@example.com" }),
    password: Str({ required: false, example: "newPassword123" }),
    profilePhoto: Str({ required: false, example: "https://example.com/photo.jpg" }),
    coverPhoto: Str({ required: false, example: "https://example.com/cover.jpg" }),
    bio: z.string().max(100, "Bio must be at most 100 characters").optional(),
});

export const LoginSchema = z.object({
    email: Str({ example: "user@example.com" }),
    password: Str({ example: "password123" }),
});

export const RegisterSchema = z.object({
    name: Str({ example: "John Doe" }),
    email: Str({ example: "user@example.com" }),
    password: Str({ example: "password123" }),
});

export const TokenResponseSchema = z.object({
    token: Str(),
    user: z.object({
        id: Str(),
        name: Str(),
        email: Str(),
        role: Str({ example: "free" }),
    }),
});
