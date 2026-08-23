/**
 * Jobs agendados com node-cron
 */
/**
 * Inicializa todos os jobs
 */
export declare function initializeJobs(): {
    syncJob: import("node-cron").ScheduledTask | null;
    cacheCleanupJob: import("node-cron").ScheduledTask | null;
    statsJob: import("node-cron").ScheduledTask | null;
};
/**
 * Para todos os jobs
 */
export declare function stopAllJobs(jobsObj: any): void;
/**
 * Executa sincronização manualmente
 */
export declare function triggerManualSync(full?: boolean): Promise<import("../services/sync/index.js").SyncResult>;
export declare function getSyncRuntimeStatus(): {
    running: boolean;
    nextRunAt: Date | null;
};
//# sourceMappingURL=sync.d.ts.map