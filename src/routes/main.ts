import type { Hono } from "hono";
import { AuthSignIn } from "./swagger/authSignIn";
import { AuthSignUp } from "./swagger/authSignUp";

type OpenAPI = ReturnType<typeof import("chanfana").fromHono<Hono<{ Bindings: Env }>>>;

export function registerRoutes(openapi: OpenAPI) {
    openapi.post("/api/auth/signin", AuthSignIn);
    openapi.post("/api/auth/signup", AuthSignUp);
}
