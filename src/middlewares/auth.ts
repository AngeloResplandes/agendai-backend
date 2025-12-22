import type { AppContext, JWTPayload } from "../types/types";
import { verify } from "hono/jwt";
import { findUserById } from "../services/user";

/**
 * Extrai o userId do token JWT no header Authorization
 * @returns userId ou null se token inválido/ausente
 */
export async function getUserIdFromToken(c: AppContext): Promise<string | null> {
    const authHeader = c.req.header("authorization");
    if (!authHeader) return null;

    const token = authHeader.split(" ")[1];
    if (!token) return null;

    try {
        const decoded = await verify(token, c.env.JWT_SECRET) as JWTPayload;
        return decoded.id;
    } catch {
        return null;
    }
}

/**
 * Middleware que requer autenticação
 * @returns { userId, userName } ou null se não autenticado
 */
export async function requireAuth(c: AppContext): Promise<{ userId: string; userName: string } | null> {
    const userId = await getUserIdFromToken(c);
    if (!userId) {
        return null;
    }

    // Buscar nome do usuário
    const user = await findUserById(c.env.DB, userId);
    if (!user) {
        return null;
    }

    return { userId, userName: user.name };
}

/**
 * Retorna resposta de erro de autenticação
 */
export function unauthorizedResponse(c: AppContext) {
    return c.json({ error: "Acesso negado" }, 401);
}
