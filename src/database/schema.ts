import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const user = sqliteTable("user", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name", { length: 255 }).notNull(),
    email: text("email", { length: 255 }).notNull().unique(),
    password: text("password", { length: 255 }).notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date().toISOString()),
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
