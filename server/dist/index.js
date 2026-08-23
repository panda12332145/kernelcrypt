/**
 * Entry point da aplicação
 */
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { createApp, startServer } from './api/app.js';
import { gitHubService } from './services/github/index.js';
import { initializeJobs, stopAllJobs } from './jobs/sync.js';
import { pathToFileURL } from 'url';
async function main() {
    try {
        logger.info('═══════════════════════════════════════════════════════');
        logger.info('🎯 WIKI BACKEND - Sistema Dinâmico Alimentado por GitHub');
        logger.info('═══════════════════════════════════════════════════════');
        // 1. Validar GitHub
        logger.info('🔐 Validando acesso ao GitHub...');
        const isConnected = await gitHubService.testConnection();
        if (!isConnected) {
            logger.error('❌ Falha ao conectar ao GitHub. Verifique GITHUB_TOKEN e repositório.');
            process.exit(1);
        }
        // 2. Criar Express app
        logger.info('🏗️ Criando aplicação Express...');
        const app = createApp();
        // 3. Inicializar jobs de sincronização
        logger.info('📅 Inicializando jobs agendados...');
        const jobs = initializeJobs();
        // 4. Sincronização inicial
        if (config.sync.enabled) {
            logger.info('📦 Executando sincronização inicial...');
            try {
                const { syncService } = await import('./services/sync/index.js');
                const result = await syncService.sync(true);
                logger.info('✅ Sincronização inicial concluída', {
                    filesProcessed: result.filesProcessed,
                    status: result.status,
                });
            }
            catch (error) {
                logger.error('⚠️ Erro na sincronização inicial (continuando)', error);
            }
        }
        else {
            logger.warn('⚠️ Sincronização automática desabilitada');
        }
        // 5. Iniciar servidor
        logger.info('🚀 Iniciando servidor HTTP...');
        await startServer(app);
        // Graceful shutdown
        process.on('SIGINT', () => {
            logger.info('⏹️ SIGINT recebido, encerrando...');
            stopAllJobs(jobs);
            process.exit(0);
        });
        logger.info('✅ Wiki Backend está pronto e operacional');
    }
    catch (error) {
        logger.error('❌ Erro fatal ao iniciar aplicação', error);
        process.exit(1);
    }
}
// Executar main
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main();
}
export default main;
//# sourceMappingURL=index.js.map