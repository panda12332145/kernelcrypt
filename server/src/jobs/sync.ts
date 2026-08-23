/**
 * Jobs agendados com node-cron
 */

import cron from 'node-cron';
import { config } from '@/config';
import { syncService } from '@/services/sync';
import { logger } from '@/utils/logger';

let syncJobRunning = false;
let nextRunAt: Date | null = null;

/**
 * Sincronização automática agendada
 */
const createSyncJob = () => {
  if (!config.sync.enabled) {
    logger.warn('⚠️ Sincronização automática desabilitada');
    return null;
  }

  // Converter horas em padrão cron (a cada N horas)
  // Para cada 24h: "0 */24 * * *" (todos os dias à meia-noite)
  // Para cada 12h: "0 */12 * * *" (a cada 12 horas)
  const hours = config.sync.intervalHours;
  const cronPattern = `0 */${Math.max(1, hours)} * * *`;
  nextRunAt = new Date(Date.now() + config.sync.intervalMs);

  const job = cron.schedule(cronPattern, async () => {
    if (syncJobRunning) {
      logger.warn('⏳ Sincronização já em andamento, ignorando...');
      return;
    }

    syncJobRunning = true;

    try {
      nextRunAt = new Date(Date.now() + config.sync.intervalMs);
      logger.info(`🚀 Iniciando sincronização automática (${cronPattern})`);
      const result = await syncService.sync(false);

      logger.info('✅ Sincronização automática concluída', {
        status: result.status,
        filesProcessed: result.filesProcessed,
        duration: `${result.duration}ms`,
      });
    } catch (error) {
      logger.error('❌ Erro na sincronização automática', error);
    } finally {
      syncJobRunning = false;
    }
  });

  logger.info(`📅 Job de sincronização agendado: ${cronPattern}`);
  return job;
};

/**
 * Limpeza de cache expirado
 */
const createCacheCleanupJob = () => {
  // Executar a cada 30 minutos
  const job = cron.schedule('*/30 * * * *', () => {
    logger.debug('🧹 Limpando cache...');
    // O cacheManager já faz cleanup automático, mas podemos adicionar lógica aqui se necessário
  });

  return job;
};

/**
 * Relatório de estatísticas
 */
const createStatsJob = () => {
  // Executar diariamente às 9 AM
  const job = cron.schedule('0 9 * * *', async () => {
    logger.info('📊 Executando relatório diário de estatísticas');

    try {
      // TODO: gerar estatísticas e salvar no banco
      logger.info('✅ Relatório de estatísticas gerado');
    } catch (error) {
      logger.error('❌ Erro ao gerar relatório', error);
    }
  });

  return job;
};

/**
 * Inicializa todos os jobs
 */
export function initializeJobs() {
  logger.info('🔧 Inicializando jobs agendados...');

  const jobs = [
    createSyncJob(),
    createCacheCleanupJob(),
    createStatsJob(),
  ].filter(Boolean);

  logger.info(`✅ ${jobs.length} jobs agendados com sucesso`);

  return {
    syncJob: jobs[0],
    cacheCleanupJob: jobs[1],
    statsJob: jobs[2],
  };
}

/**
 * Para todos os jobs
 */
export function stopAllJobs(jobsObj: any) {
  if (jobsObj.syncJob) {
    jobsObj.syncJob.stop();
    logger.info('⏹️ Job de sincronização parado');
  }
  if (jobsObj.cacheCleanupJob) {
    jobsObj.cacheCleanupJob.stop();
    logger.info('⏹️ Job de limpeza de cache parado');
  }
  if (jobsObj.statsJob) {
    jobsObj.statsJob.stop();
    logger.info('⏹️ Job de estatísticas parado');
  }
}

/**
 * Executa sincronização manualmente
 */
export async function triggerManualSync(full: boolean = false) {
  if (syncJobRunning) {
    throw new Error('Sincronização já em andamento');
  }

  syncJobRunning = true;

  try {
    const result = await syncService.sync(full);
    return result;
  } finally {
    syncJobRunning = false;
  }
}

export function getSyncRuntimeStatus() {
  return {
    running: syncJobRunning,
    nextRunAt,
  };
}
