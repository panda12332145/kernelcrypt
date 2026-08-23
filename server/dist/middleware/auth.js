import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';
export const requireAdmin = (req, res, next) => {
    // If no auth token is configured, allow in dev but reject in prod
    if (!process.env.ADMIN_API_KEY) {
        if (config.server.isDev) {
            return next();
        }
        return next(AppError.unauthorized());
    }
    const authHeader = req.header('X-API-Key') || req.header('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '') || req.query.key;
    if (!token) {
        return next(AppError.unauthorized());
    }
    if (token !== process.env.ADMIN_API_KEY) {
        return next(AppError.unauthorized());
    }
    next();
};
//# sourceMappingURL=auth.js.map