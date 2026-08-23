/**
 * Utilitários para tratamento de erros
 */
import { logger } from './logger.js';
export class AppError extends Error {
    constructor(code, statusCode, message, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        Object.setPrototypeOf(this, AppError.prototype);
    }
    static notFound(resource, details) {
        return new AppError('NOT_FOUND', 404, `${resource} não encontrado`, details);
    }
    static badRequest(message, details) {
        return new AppError('BAD_REQUEST', 400, message, details);
    }
    static unauthorized() {
        return new AppError('UNAUTHORIZED', 401, 'Não autorizado');
    }
    static forbidden() {
        return new AppError('FORBIDDEN', 403, 'Acesso proibido');
    }
    static conflict(message, details) {
        return new AppError('CONFLICT', 409, message, details);
    }
    static internal(message = 'Erro interno do servidor', details) {
        return new AppError('INTERNAL_ERROR', 500, message, details);
    }
    static rateLimit(retryAfter) {
        const err = new AppError('RATE_LIMITED', 429, 'Muitas requisições. Tente novamente mais tarde.');
        if (retryAfter) {
            err.details = { retryAfter };
        }
        return err;
    }
}
/**
 * Wrapper para async handlers em Express
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
/**
 * Log de erros com contexto
 */
export function logError(error, context) {
    const ctx = context ? `[${context}]` : '';
    if (error instanceof AppError) {
        logger.error(`${ctx} ${error.code}: ${error.message}`, {
            statusCode: error.statusCode,
            details: error.details,
        });
    }
    else if (error instanceof Error) {
        logger.error(`${ctx} ${error.message}`, {
            stack: error.stack,
        });
    }
    else {
        logger.error(`${ctx} Erro desconhecido`, { error });
    }
}
//# sourceMappingURL=errors.js.map