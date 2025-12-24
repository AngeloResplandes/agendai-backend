import type { AppContext, JWTPayload } from "../types/types";
import { verify } from "hono/jwt";
import { findUserById } from "../services/user";
import { unauthorized } from "../lib/response";

/** Resultado da autenticação */
export interface AuthResult {
    userId: string;
    userName: string;
}

/**
 * Extrai o ID do usuário do token JWT no header Authorization
 */
export async function getUserIdFromToken(c: AppContext): Promise<string | null> {
    const authHeader = c.req.header("authorization");
    if (!authHeader) return null;

    const token = authHeader.split(" ")[1];
    if (!token) return null;

    try {
        const decoded = await verify(token, c.env.JWT_SECRET) as JWTPayload;
        if (!decoded) return null;
        return decoded.id;
    } catch {
        return null;
    }
}

/**
 * Verifica autenticação e retorna dados do usuário
 * Retorna null se não autenticado ou usuário não existe
 */
export async function requireAuth(c: AppContext): Promise<AuthResult | null> {
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

/**
 * Resposta padronizada de não autorizado
 */
export function unauthorizedResponse(c: AppContext) {
    return unauthorized(c);
}

