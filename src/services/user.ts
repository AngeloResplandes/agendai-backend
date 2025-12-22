import { eq } from "drizzle-orm";
import { createDb, schema } from "../lib/drizzle";
import { hashPassword, verifyPassword } from "../lib/password";
import type { LoginUser, RegisterUser, UpdateUser, DeleteUser } from "../types/types";

export const login = async (loginUser: LoginUser) => {
    const drizzle = createDb(loginUser.db);

    const user = await drizzle.query.user.findFirst({
        where: eq(schema.user.email, loginUser.email),
    });

    if (!user) {
        return null;
    }

    const isPasswordValid = await verifyPassword(loginUser.password, user.password);
    if (!isPasswordValid) {
        return null;
    }

    return user;
};

export const findUserByEmail = async (db: D1Database, email: string) => {
    const drizzle = createDb(db);

    return drizzle.query.user.findFirst({
        where: eq(schema.user.email, email),
    });
};

export const findUserById = async (db: D1Database, userId: string) => {
    const drizzle = createDb(db);

    return drizzle.query.user.findFirst({
        where: eq(schema.user.id, userId),
    });
};

export const createUser = async (registerUser: RegisterUser) => {
    const drizzle = createDb(registerUser.db);
    const hashedPassword = await hashPassword(registerUser.password);

    const [user] = await drizzle
        .insert(schema.user)
        .values({
            name: registerUser.name,
            email: registerUser.email,
            password: hashedPassword,
        })
        .returning({
            id: schema.user.id,
            name: schema.user.name,
            email: schema.user.email,
            role: schema.user.role,
        });

    return user;
};

export const updateUser = async (data: UpdateUser) => {
    const drizzle = createDb(data.db);

    const updateData: Record<string, unknown> = {};

    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    if (data.password) updateData.password = await hashPassword(data.password);
    if (data.profilePhoto !== undefined) updateData.profilePhoto = data.profilePhoto;
    if (data.coverPhoto !== undefined) updateData.coverPhoto = data.coverPhoto;
    if (data.bio !== undefined) updateData.bio = data.bio;

    if (Object.keys(updateData).length === 0) {
        return null;
    }

    const [user] = await drizzle
        .update(schema.user)
        .set(updateData)
        .where(eq(schema.user.id, data.userId))
        .returning({
            id: schema.user.id,
            name: schema.user.name,
            email: schema.user.email,
            role: schema.user.role,
            profilePhoto: schema.user.profilePhoto,
            coverPhoto: schema.user.coverPhoto,
            bio: schema.user.bio,
        });

    return user;
};

export const deleteUser = async (data: DeleteUser) => {
    const drizzle = createDb(data.db);

    const result = await drizzle
        .delete(schema.user)
        .where(eq(schema.user.id, data.userId))
        .returning({ id: schema.user.id });

    return result.length > 0;
};
