/**
 * Tipos inferidos do schema Drizzle
 * Evita duplicação manual de tipos e mantém sincronização com o schema do banco
 */
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import * as schema from "./schema";

// ============================================
// User Types
// ============================================

/** Tipo de usuário retornado do banco (SELECT) */
export type User = InferSelectModel<typeof schema.user>;

/** Tipo para inserção de novo usuário (INSERT) */
export type NewUser = InferInsertModel<typeof schema.user>;

/** Usuário sem campos sensíveis (para responses) */
export type SafeUser = Omit<User, "password">;

/** Campos atualizáveis do usuário */
export type UserUpdate = Partial<Pick<User, "name" | "email" | "role" | "profilePhoto" | "coverPhoto" | "bio">>;

// ============================================
// Task Types
// ============================================

/** Tipo de tarefa retornado do banco (SELECT) */
export type Task = InferSelectModel<typeof schema.task>;

/** Tipo para inserção de nova tarefa (INSERT) */
export type NewTask = InferInsertModel<typeof schema.task>;

/** Campos atualizáveis da tarefa */
export type TaskUpdate = Partial<Pick<Task, "title" | "description" | "scheduledDate" | "scheduledTime" | "priority" | "status">>;

// ============================================
// Password Reset Types
// ============================================

/** Tipo de token de reset de senha (SELECT) */
export type PasswordResetToken = InferSelectModel<typeof schema.passwordResetToken>;

/** Tipo para inserção de token de reset (INSERT) */
export type NewPasswordResetToken = InferInsertModel<typeof schema.passwordResetToken>;

// ============================================
// Re-export schema enums
// ============================================

export type { UserRole, TaskPriority, TaskStatus } from "./schema";
