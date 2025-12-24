import type { Context } from "hono";
import type { TaskPriority, TaskStatus, UserRole } from "../database/types";

// ============================================
// App Context
// ============================================

export type AppContext = Context<{ Bindings: Env }>;

// ============================================
// JWT
// ============================================

export type JWTPayload = {
	id: string;
	exp?: number;
};

// ============================================
// Auth Service Types
// ============================================

export type LoginInput = {
	email: string;
	password: string;
};

export type RegisterInput = {
	name: string;
	email: string;
	password: string;
};

export type ForgotPasswordInput = {
	email: string;
};

export type ValidateTokenInput = {
	email: string;
	token: string;
};

export type ResetPasswordInput = {
	email: string;
	token: string;
	newPassword: string;
};

// ============================================
// User Service Types
// ============================================

export type UpdateUserInput = {
	userId: string;
	name?: string;
	email?: string;
	password?: string;
	role?: UserRole;
	profilePhoto?: string;
	coverPhoto?: string;
	bio?: string;
};

export type DeleteUserInput = {
	userId: string;
};

// ============================================
// Task Service Types
// ============================================

export type CreateTaskInput = {
	userId: string;
	title: string;
	description?: string;
	scheduledDate?: string;
	scheduledTime?: string;
	priority?: TaskPriority;
	createdByAgent?: boolean;
};

export type UpdateTaskInput = {
	taskId: string;
	userId: string;
	title?: string;
	description?: string;
	scheduledDate?: string;
	scheduledTime?: string;
	priority?: TaskPriority;
	status?: TaskStatus;
};

export type DeleteTaskInput = {
	taskId: string;
	userId: string;
};

// ============================================
// Groq Agent Types
// ============================================

export type GroqAgentTask = {
	action: "create" | "update" | "delete";
	taskIdentifier?: string;
	title?: string;
	description?: string;
	scheduledDate?: string;
	scheduledTime?: string;
	priority?: TaskPriority;
	status?: TaskStatus;
};

export type GroqAgentResponse = {
	tasks: GroqAgentTask[];
};

export type GroqConversationResponse = {
	isConversation: true;
	message: string;
};

export type GroqTasksResponse = {
	isConversation: false;
	tasks: GroqAgentTask[];
};

export type GroqFullResponse = GroqConversationResponse | GroqTasksResponse;

// ============================================
// Legacy Types (para compatibilidade)
// Deprecated: usar os novos tipos acima
// ============================================

/** @deprecated Use LoginInput */
export type LoginUser = {
	db: D1Database;
	email: string;
	password: string;
};

/** @deprecated Use RegisterInput */
export type RegisterUser = {
	db: D1Database;
	name: string;
	email: string;
	password: string;
};

/** @deprecated Use ForgotPasswordInput */
export type ForgotPassword = {
	db: D1Database;
	email: string;
};

/** @deprecated Use ValidateTokenInput */
export type ValidateToken = {
	db: D1Database;
	email: string;
	token: string;
};

/** @deprecated Use ResetPasswordInput */
export type ResetPasswordRequest = {
	db: D1Database;
	email: string;
	token: string;
	newPassword: string;
};

/** @deprecated Use UpdateUserInput */
export type UpdateUser = {
	db: D1Database;
	userId: string;
	name?: string;
	email?: string;
	password?: string;
	role?: UserRole;
	profilePhoto?: string;
	coverPhoto?: string;
	bio?: string;
};

/** @deprecated Use DeleteUserInput */
export type DeleteUser = {
	db: D1Database;
	userId: string;
};

/** @deprecated Use CreateTaskInput */
export type CreateTask = {
	db: D1Database;
	userId: string;
	title: string;
	description?: string;
	scheduledDate?: string;
	scheduledTime?: string;
	priority?: TaskPriority;
	createdByAgent?: boolean;
};

/** @deprecated Use UpdateTaskInput */
export type UpdateTaskData = {
	db: D1Database;
	taskId: string;
	userId: string;
	title?: string;
	description?: string;
	scheduledDate?: string;
	scheduledTime?: string;
	priority?: TaskPriority;
	status?: TaskStatus;
};

/** @deprecated Use DeleteTaskInput */
export type DeleteTask = {
	db: D1Database;
	taskId: string;
	userId: string;
};
