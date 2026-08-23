/**
 * Logger simples com suporte a níveis
 */
import { config } from '../config/index.js';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
const LogLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};
const LogColors = {
    error: '\x1b[31m',
    warn: '\x1b[33m',
    info: '\x1b[36m',
    debug: '\x1b[35m',
    reset: '\x1b[0m',
};
let logStream = null;
function getLogStream() {
    if (logStream)
        return logStream;
    if (config.logging.file) {
        const dir = dirname(config.logging.file);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        logStream = createWriteStream(config.logging.file, { flags: 'a' });
    }
    return logStream;
}
function log(level, message, meta) {
    const currentLevel = LogLevels[config.logging.level];
    if (LogLevels[level] > currentLevel)
        return;
    const timestamp = new Date().toISOString();
    const color = LogColors[level];
    const reset = LogColors.reset;
    let formatted = `${timestamp} [${level.toUpperCase()}] ${message}`;
    if (meta) {
        formatted += `\n${JSON.stringify(meta, null, 2)}`;
    }
    // Console output
    if (config.logging.level !== 'error') {
        console.log(`${color}${formatted}${reset}`);
    }
    // File output
    const stream = getLogStream();
    if (stream) {
        stream.write(formatted + '\n');
    }
}
export const logger = {
    error: (message, meta) => log('error', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    info: (message, meta) => log('info', message, meta),
    debug: (message, meta) => log('debug', message, meta),
};
//# sourceMappingURL=logger.js.map