import type { Hono } from "hono";
import { AuthSignIn } from "./swagger/authSignIn";
import { AuthSignUp } from "./swagger/authSignUp";
import { ForgotPassword } from "./swagger/forgotPassword";
import { ValidateToken } from "./swagger/validateToken";
import { ResetPassword } from "./swagger/resetPassword";
import { UserGetSelf, UserUpdateSelf, UserDeleteSelf } from "./swagger/userSelf";
import { AdminGetUser, AdminUpdateUser, AdminDeleteUser } from "./swagger/userAdmin";

type OpenAPI = ReturnType<typeof import("chanfana").fromHono<Hono<{ Bindings: Env }>>>;

export function registerRoutes(openapi: OpenAPI) {
    // Auth routes
    openapi.post("/api/auth/signin", AuthSignIn);
    openapi.post("/api/auth/signup", AuthSignUp);
    openapi.post("/api/auth/forgot-password", ForgotPassword);
    openapi.post("/api/auth/validate-token", ValidateToken);
    openapi.post("/api/auth/reset-password", ResetPassword);

    // User self-management
    openapi.get("/api/user/me", UserGetSelf);
    openapi.put("/api/user/me", UserUpdateSelf);
    openapi.delete("/api/user/me", UserDeleteSelf);

    // Admin user management
    openapi.get("/api/admin/users/:userId", AdminGetUser);
    openapi.put("/api/admin/users/:userId", AdminUpdateUser);
    openapi.delete("/api/admin/users/:userId", AdminDeleteUser);
}
