import { eq } from "drizzle-orm";
import { createDb, schema } from "../lib/drizzle";
import { hashPassword, verifyPassword } from "../lib/password";
import { LoginUser, RegisterUser } from "../types/types";

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
        });

    return user;
};
