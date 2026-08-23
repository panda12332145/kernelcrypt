import { Router } from 'express';
import { prisma } from '../../database/prisma.js';
import { asyncHandler } from '../../utils/errors.js';
const router = Router();
router.get('/', asyncHandler(async (req, res) => {
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const assets = await prisma.mediaAsset.findMany({
        where: type ? { type } : undefined,
        orderBy: { updatedAt: 'desc' },
        take: limit,
    });
    res.json({
        success: true,
        data: assets,
    });
}));
export default router;
//# sourceMappingURL=assets.js.map