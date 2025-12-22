import { eq, and } from "drizzle-orm";
import { createDb, schema } from "../lib/drizzle";
import type { CreateTask, UpdateTaskData, DeleteTask } from "../types/types";

export const createTask = async (data: CreateTask) => {
    const drizzle = createDb(data.db);

    const [task] = await drizzle
        .insert(schema.task)
        .values({
            userId: data.userId,
            title: data.title,
            description: data.description,
            scheduledDate: data.scheduledDate,
            scheduledTime: data.scheduledTime,
            priority: data.priority || "medium",
            createdByAgent: data.createdByAgent || false,
        })
        .returning();

    return task;
};

export const getTasksByUserId = async (db: D1Database, userId: string) => {
    const drizzle = createDb(db);

    return drizzle.query.task.findMany({
        where: eq(schema.task.userId, userId),
        orderBy: (task, { desc }) => [desc(task.createdAt)],
    });
};

export const findTaskByTitle = async (db: D1Database, userId: string, searchTitle: string) => {
    const drizzle = createDb(db);

    const tasks = await drizzle.query.task.findMany({
        where: eq(schema.task.userId, userId),
        orderBy: (task, { desc }) => [desc(task.createdAt)],
    });

    // Search for task with title containing the search term (case insensitive)
    const searchLower = searchTitle.toLowerCase();
    return tasks.find(task =>
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower))
    );
};

export const getTaskById = async (db: D1Database, taskId: string, userId: string) => {
    const drizzle = createDb(db);

    return drizzle.query.task.findFirst({
        where: and(
            eq(schema.task.id, taskId),
            eq(schema.task.userId, userId)
        ),
    });
};

export const updateTask = async (data: UpdateTaskData) => {
    const drizzle = createDb(data.db);

    const existingTask = await getTaskById(data.db, data.taskId, data.userId);
    if (!existingTask) {
        return null;
    }

    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.scheduledDate !== undefined) updateData.scheduledDate = data.scheduledDate;
    if (data.scheduledTime !== undefined) updateData.scheduledTime = data.scheduledTime;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;

    if (Object.keys(updateData).length === 0) {
        return existingTask;
    }

    const [task] = await drizzle
        .update(schema.task)
        .set(updateData)
        .where(and(
            eq(schema.task.id, data.taskId),
            eq(schema.task.userId, data.userId)
        ))
        .returning();

    return task;
};

export const deleteTask = async (data: DeleteTask) => {
    const drizzle = createDb(data.db);

    const existingTask = await getTaskById(data.db, data.taskId, data.userId);
    if (!existingTask) {
        return false;
    }

    const result = await drizzle
        .delete(schema.task)
        .where(and(
            eq(schema.task.id, data.taskId),
            eq(schema.task.userId, data.userId)
        ))
        .returning({ id: schema.task.id });

    return result.length > 0;
};
