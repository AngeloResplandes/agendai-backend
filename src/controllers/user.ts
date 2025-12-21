import type { Context } from "hono";
import { authSignIn } from "../valueObjects/auth-signIn";
import { authSignUp } from "../valueObjects/auth-signUp";
import { login, findUserByEmail, createUser } from "../services/user";
import { createJWT } from "../lib/jwt";

export const signIn = async (c: Context<{ Bindings: Env }>) => {
    const body = await c.req.json();
    const data = authSignIn.safeParse(body);

    if (!data.success) {
        return c.json({ error: data.error.flatten().fieldErrors }, 400);
    }

    const user = await login(c.env.DB, data.data.email, data.data.password);
    if (!user) {
        return c.json({ error: "Email ou senha inválidos" }, 401);
    }

    const token = await createJWT(user.id, c.env.JWT_SECRET);

    return c.json({
        token,
        user: { id: user.id, name: user.name, email: user.email }
    });
};

export const signUp = async (c: Context<{ Bindings: Env }>) => {
    const body = await c.req.json();
    const data = authSignUp.safeParse(body);

    if (!data.success) {
        return c.json({ error: data.error.flatten().fieldErrors }, 400);
    }

    const existingUser = await findUserByEmail(c.env.DB, data.data.email);
    if (existingUser) {
        return c.json({ error: "Email já está em uso" }, 409);
    }

    const newUser = await createUser(
        c.env.DB,
        data.data.name,
        data.data.email,
        data.data.password
    );

    return c.json({ newUser }, 201);
};
