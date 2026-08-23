import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  // Node
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  API_PREFIX: z.string().default('/api/wiki'),

  // GitHub
  GITHUB_TOKEN: z.string().optional().default(''),
  GITHUB_OWNER: z.string().min(1).default('panda12332145'),
  GITHUB_REPO: z.string().min(1).default('cyber-wiki-content'),
  GITHUB_BRANCH: z.string().min(1).default('main'),
  GITHUB_CONTENT_ROOT: z.string().min(1).default('categories'),

  // Database
  DATABASE_URL: z.string().default('file:./wiki.db'),

  // Sync
  SYNC_INTERVAL_HOURS: z.coerce.number().default(24),
  SYNC_ENABLED: z.enum(['true', 'false']).transform((v) => v === 'true').pipe(z.boolean()).default(true),
  MAX_CONCURRENT_REQUESTS: z.coerce.number().default(5),
  GITHUB_API_TIMEOUT: z.coerce.number().default(30000),

  // Cache
  CACHE_ENABLED: z.enum(['true', 'false']).transform((v) => v === 'true').pipe(z.boolean()).default(true),
  CACHE_TTL_MINUTES: z.coerce.number().default(60),
  CACHE_MAX_SIZE_MB: z.coerce.number().default(500),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().optional(),

  // Security
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

export const env = EnvSchema.parse(process.env);
process.env.DATABASE_URL = env.DATABASE_URL;

// Configurações derivadas
export const config = {
  server: {
    port: env.PORT,
    apiPrefix: env.API_PREFIX,
    isDev: env.NODE_ENV === 'development',
    isProd: env.NODE_ENV === 'production',
  },

  github: {
    token: env.GITHUB_TOKEN || undefined,
    owner: env.GITHUB_OWNER,
    repo: env.GITHUB_REPO,
    branch: env.GITHUB_BRANCH,
    contentRoot: env.GITHUB_CONTENT_ROOT.replace(/^\/+|\/+$/g, ''),
    timeout: env.GITHUB_API_TIMEOUT,
    maxConcurrent: env.MAX_CONCURRENT_REQUESTS,
    rawBaseUrl: `https://raw.githubusercontent.com/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/${env.GITHUB_BRANCH}`,
  },

  sync: {
    enabled: env.SYNC_ENABLED,
    intervalHours: env.SYNC_INTERVAL_HOURS,
    intervalMs: env.SYNC_INTERVAL_HOURS * 60 * 60 * 1000,
  },

  cache: {
    enabled: env.CACHE_ENABLED,
    ttlMs: env.CACHE_TTL_MINUTES * 60 * 1000,
    maxSizeBytes: env.CACHE_MAX_SIZE_MB * 1024 * 1024,
  },

  cors: {
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  logging: {
    level: env.LOG_LEVEL,
    file: env.LOG_FILE,
  },
};

export type Config = typeof config;
