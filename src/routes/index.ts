import type { Hono } from "hono";

// Auth routes
import { SignIn, SignUp, ForgotPassword, ValidateToken, ResetPassword } from "./auth";

// User routes
import { GetSelf, UpdateSelf, DeleteSelf, AdminGetUser, AdminUpdateUser, AdminDeleteUser } from "./user";

// Task routes
import { Create as TaskCreate, List as TaskList, Get as TaskGet, Update as TaskUpdate, Delete as TaskDelete } from "./tasks";

// Agent routes
import { Schedule as AgentSchedule } from "./agent";

type OpenAPI = ReturnType<typeof import("chanfana").fromHono<Hono<{ Bindings: Env }>>>;

export function registerRoutes(openapi: OpenAPI) {
    // Auth routes
    openapi.post("/api/auth/signin", SignIn);
    openapi.post("/api/auth/signup", SignUp);
    openapi.post("/api/auth/forgot-password", ForgotPassword);
    openapi.post("/api/auth/validate-token", ValidateToken);
    openapi.post("/api/auth/reset-password", ResetPassword);

    // Admin user management
    openapi.get("/api/admin/users/:userId", AdminGetUser);
    openapi.put("/api/admin/users/:userId", AdminUpdateUser);
    openapi.delete("/api/admin/users/:userId", AdminDeleteUser);

    // User self-management
    openapi.get("/api/user/me", GetSelf);
    openapi.put("/api/user/me", UpdateSelf);
    openapi.delete("/api/user/me", DeleteSelf);

    // Task routes
    openapi.post("/api/tasks", TaskCreate);
    openapi.get("/api/tasks", TaskList);
    openapi.get("/api/tasks/:taskId", TaskGet);
    openapi.put("/api/tasks/:taskId", TaskUpdate);
    openapi.delete("/api/tasks/:taskId", TaskDelete);

    // Agent routes
    openapi.post("/api/agent/schedule", AgentSchedule);
}
