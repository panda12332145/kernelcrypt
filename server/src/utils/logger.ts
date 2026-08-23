/**
 * Logger simples com suporte a níveis
 */

import { config } from '@/config';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

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

let logStream: ReturnType<typeof createWriteStream> | null = null;

function getLogStream() {
  if (logStream) return logStream;

  if (config.logging.file) {
    const dir = dirname(config.logging.file);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    logStream = createWriteStream(config.logging.file, { flags: 'a' });
  }

  return logStream;
}

function log(level: LogLevel, message: string, meta?: unknown) {
  const currentLevel = LogLevels[config.logging.level];
  if (LogLevels[level] > currentLevel) return;

  const timestamp = new Date().toISOString();
  const color = LogColors[level as keyof typeof LogColors];
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
  error: (message: string, meta?: unknown) => log('error', message, meta),
  warn: (message: string, meta?: unknown) => log('warn', message, meta),
  info: (message: string, meta?: unknown) => log('info', message, meta),
  debug: (message: string, meta?: unknown) => log('debug', message, meta),
};
