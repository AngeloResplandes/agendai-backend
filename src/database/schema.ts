import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const userRoles = ["free", "pro", "admin"] as const;
export type UserRole = typeof userRoles[number];

export const taskPriorities = ["low", "medium", "high"] as const;
export type TaskPriority = typeof taskPriorities[number];

export const taskStatuses = ["pending", "in_progress", "completed", "cancelled"] as const;
export type TaskStatus = typeof taskStatuses[number];

export const user = sqliteTable("user", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name", { length: 255 }).notNull(),
    email: text("email", { length: 255 }).notNull().unique(),
    password: text("password", { length: 255 }).notNull(),
    role: text("role", { length: 10 }).default("free").notNull().$type<UserRole>(),
    profilePhoto: text("profile_photo", { length: 500 }),
    coverPhoto: text("cover_photo", { length: 500 }),
    bio: text("bio", { length: 100 }),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date().toISOString()),
});

export const passwordResetToken = sqliteTable("password_reset_token", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    token: text("token", { length: 6 }).notNull(),
    expiresAt: text("expires_at").notNull(),
    used: integer("used", { mode: "boolean" }).default(false),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const task = sqliteTable("task", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    title: text("title", { length: 255 }).notNull(),
    description: text("description", { length: 1000 }),
    scheduledDate: text("scheduled_date"),
    scheduledTime: text("scheduled_time"),
    priority: text("priority", { length: 10 }).default("medium").$type<TaskPriority>(),
    status: text("status", { length: 20 }).default("pending").$type<TaskStatus>(),
    createdByAgent: integer("created_by_agent", { mode: "boolean" }).default(false),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date().toISOString()),
});