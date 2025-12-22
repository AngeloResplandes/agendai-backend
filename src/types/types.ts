import type { Context } from "hono";

export type AppContext = Context<{ Bindings: Env }>;

export type JWTPayload = {
	id: string;
	exp?: number;
};

export type LoginUser = {
	db: D1Database,
	email: string,
	password: string
}

export type RegisterUser = {
	db: D1Database,
	name: string,
	email: string,
	password: string
}

export type ForgotPassword = {
	db: D1Database,
	email: string
}

export type ValidateToken = {
	db: D1Database,
	email: string,
	token: string
}

export type ResetPasswordRequest = {
	db: D1Database,
	email: string,
	token: string,
	newPassword: string
}

export type UpdateUser = {
	db: D1Database,
	userId: string,
	name?: string,
	email?: string,
	password?: string,
	role?: "free" | "pro" | "admin",
	profilePhoto?: string,
	coverPhoto?: string,
	bio?: string
}

export type DeleteUser = {
	db: D1Database,
	userId: string
}

export type CreateTask = {
	db: D1Database,
	userId: string,
	title: string,
	description?: string,
	scheduledDate?: string,
	scheduledTime?: string,
	priority?: "low" | "medium" | "high",
	createdByAgent?: boolean
}

export type UpdateTaskData = {
	db: D1Database,
	taskId: string,
	userId: string,
	title?: string,
	description?: string,
	scheduledDate?: string,
	scheduledTime?: string,
	priority?: "low" | "medium" | "high",
	status?: "pending" | "in_progress" | "completed" | "cancelled"
}

export type DeleteTask = {
	db: D1Database,
	taskId: string,
	userId: string
}

export type GroqScheduleResponse = {
	title: string,
	description?: string,
	scheduledDate?: string,
	scheduledTime?: string,
	priority?: "low" | "medium" | "high"
}
