/**
 * Router para sincronização manualmente
 */
import { Router } from 'express';
import { asyncHandler, AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { getSyncRuntimeStatus, triggerManualSync } from '../../jobs/sync.js';
import { prisma } from '../../database/prisma.js';
import { requireAdmin } from '../../middleware/auth.js';
const router = Router();
/**
 * POST /sync
 * Dispara sincronização manual
 */
router.post('/', requireAdmin, asyncHandler(async (req, res) => {
    const { full } = req.body;
    logger.info('🔄 Sincronização manual acionada', { full });
    try {
        const result = await triggerManualSync(full === true);
        res.json({
            success: true,
            data: result,
            message: `Sincronização ${result.status}`,
        });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('já em andamento')) {
            throw AppError.conflict('Sincronização já em andamento');
        }
        throw error;
    }
}));
/**
 * GET /sync/status
 * Obtém status da última sincronização
 */
router.get('/status', requireAdmin, asyncHandler(async (_req, res) => {
    const lastSync = await prisma.syncLog.findFirst({
        orderBy: { startedAt: 'desc' },
    });
    res.json({
        success: true,
        data: {
            lastSync,
            syncRunning: getSyncRuntimeStatus().running,
            nextSync: getSyncRuntimeStatus().nextRunAt,
        },
    });
}));
export default router;
//# sourceMappingURL=sync.js.map