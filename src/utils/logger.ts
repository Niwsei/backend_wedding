// src/utils/logger.ts
import pino, { Logger, LoggerOptions, DestinationStream } from 'pino';
import { randomUUID } from 'crypto';
import config from '../config';

const nodeEnvForLogger = process.env.NODE_ENV || 'development';
const logLevelForLogger = process.env.LOG_LEVEL || (nodeEnvForLogger === 'production' ? 'info' : 'debug');
const isProductionForLogger = nodeEnvForLogger === 'production';

const pinoOptions: LoggerOptions = {
  level: logLevelForLogger,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      hostname: bindings.hostname,
    }),
  },
  redact: {
    paths: [
      'req.headers.authorization', 'req.headers.cookie',
      'req.body.password', 'req.body.newPassword', 'req.body.currentPassword',
      'res.headers["set-cookie"]', '*.password_hash', '*.token',
      'user.email',
    ],
    censor: '[REDACTED]',
    remove: false,
  },
};

let transport: DestinationStream | undefined;

// ✅ ประกาศ logger ให้ชัดเจน และใช้ let
let logger: Logger;

// กำหนดค่าของ logger ให้ครอบคลุมทั้ง production และ dev
if (!isProductionForLogger) {
  transport = pino.transport({
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname,requestId',
    },
  });
  logger = pino(pinoOptions, transport);
} else {
  logger = pino(pinoOptions);
}

// Middleware เหมือนเดิม
export const addRequestId = (req: any, res: any, next: any) => {
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

export const requestLogger = (req: any, res: any, next: any) => {
  const startTime = process.hrtime();
  const requestId = req.id || req.headers['x-request-id'] || randomUUID();

  logger.info({
    requestId,
    req: {
      method: req.method,
      url: req.originalUrl,
      remoteAddress: req.ip,
    }
  }, `Incoming request: ${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    const hrtime = process.hrtime(startTime);
    const responseTimeMs = hrtime[0] * 1000 + hrtime[1] / 1000000;
    const { statusCode } = res;
    const user = req.user ? { userId: req.user.userId, role: req.user.role } : undefined;

    const logData = {
      requestId,
      req: {
        method: req.method,
        url: req.originalUrl,
        remoteAddress: req.ip,
      },
      res: {
        statusCode: statusCode,
      },
      responseTime: `${responseTimeMs.toFixed(3)}ms`,
      user,
    };

    const message = `Outgoing response: ${req.method} ${req.originalUrl} ${statusCode}`;
    if (statusCode >= 500) {
      logger.error(logData, message);
    } else if (statusCode >= 400) {
      logger.warn(logData, message);
    } else {
      logger.info(logData, message);
    }
  });
  next();
};

// ✅ export ตัว logger ที่สร้างไว้อย่างถูกต้อง
export default logger;
