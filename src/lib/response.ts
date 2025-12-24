/**
 * Helper para responses padronizados
 */
import type { Context } from "hono";

type AppContext = Context<{ Bindings: Env }>;

/**
 * Response de sucesso padronizada
 */
export function success<T extends Record<string, unknown>>(
    c: AppContext,
    data: T,
    status: 200 | 201 = 200
) {
    return c.json(data, status);
}

/**
 * Response de erro padronizada
 */
export function error(
    c: AppContext,
    message: string,
    status: 400 | 401 | 403 | 404 | 500 = 400
) {
    return c.json({ error: message }, status);
}

/**
 * Response de erro de autenticação
 */
export function unauthorized(c: AppContext, message = "Acesso negado") {
    return error(c, message, 401);
}

/**
 * Response de erro de permissão
 */
export function forbidden(c: AppContext, message = "Permissão insuficiente") {
    return error(c, message, 403);
}

/**
 * Response de não encontrado
 */
export function notFound(c: AppContext, message = "Recurso não encontrado") {
    return error(c, message, 404);
}

/**
 * Response de erro interno
 */
export function serverError(c: AppContext, message = "Erro interno do servidor") {
    return error(c, message, 500);
}
