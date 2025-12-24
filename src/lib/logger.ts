/**
 * Sistema de logging estruturado para observabilidade
 * Logs em formato JSON para integração com Cloudflare Analytics e outras ferramentas
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
    requestId: string;
    userId?: string;
    method?: string;
    path?: string;
}

export interface Logger {
    debug: (message: string, data?: Record<string, unknown>) => void;
    info: (message: string, data?: Record<string, unknown>) => void;
    warn: (message: string, data?: Record<string, unknown>) => void;
    error: (message: string, error?: Error, data?: Record<string, unknown>) => void;
}

function formatLog(
    level: LogLevel,
    message: string,
    context: LogContext,
    data?: Record<string, unknown>,
    error?: Error
): string {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        requestId: context.requestId,
        ...(context.userId && { userId: context.userId }),
        ...(context.method && { method: context.method }),
        ...(context.path && { path: context.path }),
        ...(data && { data }),
        ...(error && {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
        }),
    };

    return JSON.stringify(logEntry);
}

/**
 * Cria um logger com contexto de request
 */
export function createLogger(context: LogContext): Logger {
    return {
        debug: (message: string, data?: Record<string, unknown>) => {
            console.debug(formatLog("debug", message, context, data));
        },
        info: (message: string, data?: Record<string, unknown>) => {
            console.info(formatLog("info", message, context, data));
        },
        warn: (message: string, data?: Record<string, unknown>) => {
            console.warn(formatLog("warn", message, context, data));
        },
        error: (message: string, error?: Error, data?: Record<string, unknown>) => {
            console.error(formatLog("error", message, context, data, error));
        },
    };
}

/**
 * Logger padrão sem contexto de request (para uso em inicialização)
 */
export const defaultLogger: Logger = createLogger({ requestId: "system" });
