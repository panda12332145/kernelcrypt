/**
 * Utilitários para tratamento de erros
 */
import { NextFunction, Request, RequestHandler, Response } from 'express';
export declare class AppError extends Error {
    code: string;
    statusCode: number;
    details?: unknown | undefined;
    constructor(code: string, statusCode: number, message: string, details?: unknown | undefined);
    static notFound(resource: string, details?: unknown): AppError;
    static badRequest(message: string, details?: unknown): AppError;
    static unauthorized(): AppError;
    static forbidden(): AppError;
    static conflict(message: string, details?: unknown): AppError;
    static internal(message?: string, details?: unknown): AppError;
    static rateLimit(retryAfter?: number): AppError;
}
/**
 * Wrapper para async handlers em Express
 */
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => RequestHandler;
/**
 * Log de erros com contexto
 */
export declare function logError(error: unknown, context?: string): void;
//# sourceMappingURL=errors.d.ts.map