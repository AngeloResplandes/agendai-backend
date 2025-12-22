import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const userRoles = ["free", "pro", "admin"] as const;
export type UserRole = typeof userRoles[number];

export const user = sqliteTable("user", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name", { length: 255 }).notNull(),
    email: text("email", { length: 255 }).notNull().unique(),
    password: text("password", { length: 255 }).notNull(),
    role: text("role", { length: 10 }).default("free").notNull().$type<UserRole>(),
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