import type { Context } from "hono";

export type AppContext = Context<{ Bindings: Env }>;

export type AuthenticatedContext = Context<{
	Bindings: Env;
	Variables: { userId: string }
}>;

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
