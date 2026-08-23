/**
 * Utilitários para tratamento de erros
 */

import { NextFunction, Request, RequestHandler, Response } from 'express';
import { logger } from './logger';

export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static notFound(resource: string, details?: unknown) {
    return new AppError(
      'NOT_FOUND',
      404,
      `${resource} não encontrado`,
      details
    );
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(
      'BAD_REQUEST',
      400,
      message,
      details
    );
  }

  static unauthorized() {
    return new AppError(
      'UNAUTHORIZED',
      401,
      'Não autorizado'
    );
  }

  static forbidden() {
    return new AppError(
      'FORBIDDEN',
      403,
      'Acesso proibido'
    );
  }

  static conflict(message: string, details?: unknown) {
    return new AppError(
      'CONFLICT',
      409,
      message,
      details
    );
  }

  static internal(message: string = 'Erro interno do servidor', details?: unknown) {
    return new AppError(
      'INTERNAL_ERROR',
      500,
      message,
      details
    );
  }

  static rateLimit(retryAfter?: number) {
    const err = new AppError(
      'RATE_LIMITED',
      429,
      'Muitas requisições. Tente novamente mais tarde.'
    );
    if (retryAfter) {
      err.details = { retryAfter };
    }
    return err;
  }
}

/**
 * Wrapper para async handlers em Express
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Log de erros com contexto
 */
export function logError(error: unknown, context?: string) {
  const ctx = context ? `[${context}]` : '';

  if (error instanceof AppError) {
    logger.error(`${ctx} ${error.code}: ${error.message}`, {
      statusCode: error.statusCode,
      details: error.details,
    });
  } else if (error instanceof Error) {
    logger.error(`${ctx} ${error.message}`, {
      stack: error.stack,
    });
  } else {
    logger.error(`${ctx} Erro desconhecido`, { error });
  }
}
