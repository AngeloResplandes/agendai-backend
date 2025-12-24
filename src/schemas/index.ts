import { Str } from "chanfana";
import { z } from "zod";
import { VALIDATION } from "../config/constants";

// ============================================
// Error Responses
// ============================================

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

export const ForbiddenResponse = {
    "403": {
        description: "Forbidden",
        content: {
            "application/json": {
                schema: ErrorSchema,
            },
        },
    },
};

// ============================================
// Common Validators
// ============================================

const emailValidator = z
    .string()
    .email("Email inválido")
    .min(1, "Email é obrigatório");

const passwordValidator = z
    .string()
    .min(VALIDATION.password.minLength, `Senha deve ter no mínimo ${VALIDATION.password.minLength} caracteres`)
    .max(VALIDATION.password.maxLength, `Senha deve ter no máximo ${VALIDATION.password.maxLength} caracteres`);

const nameValidator = z
    .string()
    .min(VALIDATION.name.minLength, `Nome deve ter no mínimo ${VALIDATION.name.minLength} caracteres`)
    .max(VALIDATION.name.maxLength, `Nome deve ter no máximo ${VALIDATION.name.maxLength} caracteres`);

// ============================================
// Task Schemas
// ============================================

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
    title: z.string()
        .min(1, "Título é obrigatório")
        .max(VALIDATION.task.titleMaxLength, `Título deve ter no máximo ${VALIDATION.task.titleMaxLength} caracteres`),
    description: z.string()
        .max(VALIDATION.task.descriptionMaxLength, `Descrição deve ter no máximo ${VALIDATION.task.descriptionMaxLength} caracteres`)
        .optional(),
    scheduledDate: Str({ required: false, example: "2025-12-25" }),
    scheduledTime: Str({ required: false, example: "14:00" }),
    priority: z.enum(["low", "medium", "high"]).optional(),
});

export const TaskUpdateSchema = z.object({
    title: z.string()
        .max(VALIDATION.task.titleMaxLength, `Título deve ter no máximo ${VALIDATION.task.titleMaxLength} caracteres`)
        .optional(),
    description: z.string()
        .max(VALIDATION.task.descriptionMaxLength, `Descrição deve ter no máximo ${VALIDATION.task.descriptionMaxLength} caracteres`)
        .optional(),
    scheduledDate: Str({ required: false, example: "2025-12-26" }),
    scheduledTime: Str({ required: false, example: "15:00" }),
    priority: z.enum(["low", "medium", "high"]).optional(),
    status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
});

// ============================================
// User Schemas
// ============================================

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
    name: nameValidator.optional(),
    email: emailValidator.optional(),
    password: passwordValidator.optional(),
    profilePhoto: z.string().url("URL de foto inválida").optional(),
    coverPhoto: z.string().url("URL de capa inválida").optional(),
    bio: z.string().max(VALIDATION.bio.maxLength, `Bio deve ter no máximo ${VALIDATION.bio.maxLength} caracteres`).optional(),
});

// ============================================
// Auth Schemas
// ============================================

export const LoginSchema = z.object({
    email: emailValidator,
    password: z.string().min(1, "Senha é obrigatória"),
});

export const RegisterSchema = z.object({
    name: nameValidator,
    email: emailValidator,
    password: passwordValidator,
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

