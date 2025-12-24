/**
 * Contexto de request para injeção de dependências
 * Centraliza acesso ao banco de dados e informações do usuário autenticado
 */
import type { Context } from "hono";
import { createDb, type Database } from "./drizzle";

export type AppContext = Context<{ Bindings: Env }>;

export interface RequestContext {
    /** Cliente Drizzle para acesso ao banco de dados */
    db: Database;
    /** ID do usuário autenticado (se houver) */
    userId?: string;
    /** Nome do usuário autenticado (se houver) */
    userName?: string;
}

/**
 * Cria um contexto de request com acesso ao banco de dados
 */
export function createRequestContext(c: AppContext): RequestContext {
    return {
        db: createDb(c.env.DB),
    };
}

/**
 * Cria um contexto de request autenticado
 */
export function createAuthenticatedContext(
    c: AppContext,
    userId: string,
    userName: string
): RequestContext {
    return {
        db: createDb(c.env.DB),
        userId,
        userName,
    };
}
