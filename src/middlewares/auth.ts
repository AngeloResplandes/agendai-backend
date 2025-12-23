import type { AppContext, JWTPayload } from "../types/types";
import { verify } from "hono/jwt";
import { findUserById } from "../services/user";


export async function getUserIdFromToken(c: AppContext): Promise<string | null> {
    const authHeader = c.req.header("authorization");
    if (!authHeader) return null;

    const token = authHeader.split(" ")[1];
    if (!token) return null;

    const decoded = await verify(token, c.env.JWT_SECRET) as JWTPayload;
    if (!decoded) return null;
    return decoded.id;
}


export async function requireAuth(c: AppContext): Promise<{ userId: string; userName: string } | null> {
    const userId = await getUserIdFromToken(c);
    if (!userId) {
        return null;
    }

    const user = await findUserById(c.env.DB, userId);
    if (!user) {
        return null;
    }

    return { userId, userName: user.name };
}


export function unauthorizedResponse(c: AppContext) {
    return c.json({ error: "Acesso negado" }, 401);
}
