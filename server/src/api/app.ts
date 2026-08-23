/**
 * Express app - configuração central
 */

import express, {
  Express,
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from 'express';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { AppError, logError } from '@/utils/errors';
import { cacheManager } from '@/services/cache';
import { prisma } from '@/database/prisma';

// Routes
import articlesRouter from '@/api/routes/articles';
import categoriesRouter from '@/api/routes/categories';
import syncRouter from '@/api/routes/sync';
import assetsRouter from '@/api/routes/assets';
import seoRouter from '@/api/routes/seo';

export function createApp(): Express {
  const app = express();

  // ============================================================================
  // MIDDLEWARE
  // ============================================================================

  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.debug(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });

    next();
  });

  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Security headers
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'SAMEORIGIN');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.header(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' https: data:",
        "media-src 'self' https:",
        "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://raw.githubusercontent.com https://mozilla.github.io",
        "connect-src 'self' https://api.github.com https://raw.githubusercontent.com https:",
      ].join('; ')
    );
    next();
  });

  // CORS
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (config.cors.origin.includes(origin as string)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  });

  // Rate limiting (simples)
  const requestCounts = new Map<string, number[]>();

  app.use((req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - config.rateLimit.windowMs;

    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, []);
    }

    const timestamps = requestCounts.get(ip)!;
    const recentRequests = timestamps.filter((t) => t > windowStart);

    if (recentRequests.length >= config.rateLimit.maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Muitas requisições. Tente novamente mais tarde.',
        },
      });
    }

    recentRequests.push(now);
    requestCounts.set(ip, recentRequests);

    next();
  });

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  app.get('/health', (req: Request, res: Response) => {
    const stats = cacheManager.getStats();

    res.json({
      success: true,
      status: 'ok',
      timestamp: new Date(),
      server: {
        nodeEnv: config.server.isDev ? 'development' : 'production',
        port: config.server.port,
        uptime: process.uptime(),
      },
      cache: {
        enabled: config.cache.enabled,
        size: stats.entries,
        avgHits: stats.avgHits,
      },
    });
  });

  // ============================================================================
  // ROTAS
  // ============================================================================

  const apiPrefix = config.server.apiPrefix;

  app.use(`${apiPrefix}/articles`, articlesRouter);
  app.use(`${apiPrefix}/categories`, categoriesRouter);
  app.use(`${apiPrefix}/sync`, syncRouter);
  app.use(`${apiPrefix}/assets`, assetsRouter);
  app.use(`${apiPrefix}/seo`, seoRouter);

  app.get('/sitemap.xml', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const articles = await prisma.article.findMany({
        select: { slug: true, updatedAt: true, githubLastCommitDate: true },
        orderBy: { updatedAt: 'desc' },
      });

      const urls = [
        `<url><loc>/wiki</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`,
        ...articles.map(
          (article) =>
            `<url><loc>/wiki/${article.slug}</loc><lastmod>${(article.githubLastCommitDate || article.updatedAt).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
        ),
      ].join('');

      res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
    } catch (error) {
      next(error);
    }
  });

  // ============================================================================
  // 404 HANDLER
  // ============================================================================

  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Rota não encontrada: ${req.method} ${req.path}`,
      },
    });
  });

  // ============================================================================
  // ERROR HANDLER (deve ser o último)
  // ============================================================================

  const errorHandler: ErrorRequestHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    logError(err, `ERROR_HANDLER:${req.method}:${req.path}`);

    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...(config.server.isDev && { details: err.details }),
        },
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
        ...(config.server.isDev && { details: err.message }),
      },
    });
  };


  app.use(errorHandler);

  return app;
}

/**
 * Inicia o servidor
 */
export async function startServer(app: Express): Promise<void> {
  return new Promise((resolve) => {
    const server = app.listen(config.server.port, '127.0.0.1', () => {
      logger.info(`🚀 Servidor iniciado em porta ${config.server.port}`);
      logger.info(`🔗 API disponível em http://127.0.0.1:${config.server.port}${config.server.apiPrefix}`);
      logger.info(`📊 Health check: http://127.0.0.1:${config.server.port}/health`);
      resolve();
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('⏹️ SIGTERM recebido, encerrando servidor...');
      server.close(() => {
        logger.info('✅ Servidor encerrado');
        process.exit(0);
      });
    });
  });
}
