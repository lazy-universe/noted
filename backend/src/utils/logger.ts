import pino from 'pino';
import path from 'path';

const LOG_DIR = process.env.LOG_DIR || 'logs';

// Configure transports
const transport = pino.transport({
  targets: [
    {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    },
    {
      target: 'pino-roll',
      options: {
        file: path.join(LOG_DIR, 'app.log'),
        size: '10m',
        interval: '7d',
        mkdir: true,
      },
      level: 'info',
    },
  ],
});

// Create the logger instance
export const logger = pino(transport);
