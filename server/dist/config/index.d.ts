export declare const env: {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    API_PREFIX: string;
    GITHUB_TOKEN: string;
    GITHUB_OWNER: string;
    GITHUB_REPO: string;
    GITHUB_BRANCH: string;
    GITHUB_CONTENT_ROOT: string;
    DATABASE_URL: string;
    SYNC_INTERVAL_HOURS: number;
    SYNC_ENABLED: boolean;
    MAX_CONCURRENT_REQUESTS: number;
    GITHUB_API_TIMEOUT: number;
    CACHE_ENABLED: boolean;
    CACHE_TTL_MINUTES: number;
    CACHE_MAX_SIZE_MB: number;
    LOG_LEVEL: "error" | "warn" | "info" | "debug";
    CORS_ORIGIN: string;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_REQUESTS: number;
    LOG_FILE?: string | undefined;
};
export declare const config: {
    server: {
        port: number;
        apiPrefix: string;
        isDev: boolean;
        isProd: boolean;
    };
    github: {
        token: string | undefined;
        owner: string;
        repo: string;
        branch: string;
        contentRoot: string;
        timeout: number;
        maxConcurrent: number;
        rawBaseUrl: string;
    };
    sync: {
        enabled: boolean;
        intervalHours: number;
        intervalMs: number;
    };
    cache: {
        enabled: boolean;
        ttlMs: number;
        maxSizeBytes: number;
    };
    cors: {
        origin: string[];
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    logging: {
        level: "error" | "warn" | "info" | "debug";
        file: string | undefined;
    };
};
export type Config = typeof config;
//# sourceMappingURL=index.d.ts.map