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
	role?: "free" | "pro" | "admin"
}

export type DeleteUser = {
	db: D1Database,
	userId: string
}
