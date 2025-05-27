// src/config/prisma.ts
import { PrismaClient } from '@prisma/client'; 
// Define LogLevel type locally since it's not exported from Prisma
type LogLevel = 'info' | 'query' | 'warn' | 'error';
import logger from '../utils/logger';
import config from './index';

const logLevelsForEvents: LogLevel[] = ['query', 'info', 'warn', 'error'];

const prismaLogDefinitions = logLevelsForEvents.map(level => ({
  emit: 'event' as const,
  level: level,
}));

// ถ้าต้องการ log query ไปที่ stdout ใน dev ด้วย
// if (config.NODE_ENV !== 'production') {
//   prismaLogDefinitions.push({ emit: 'stdout', level: 'query' });
// }

const prisma = new PrismaClient({
  log: prismaLogDefinitions, // <-- ใช้ Type ที่ถูกต้อง
  // errorFormat: 'pretty', // หรือ 'minimal'
});

// Event listeners for Prisma logs
// สำหรับ $on, event names ควรจะเป็น string ตรงๆ

prisma.$on('query', (e) => {
    if (config.NODE_ENV !== 'production' || ['debug', 'trace'].includes(config.LOG_LEVEL)) {
        logger.trace({ prisma_query: e.query, params: e.params, duration_ms: e.duration }, 'Prisma Query Executed');
    }
});

prisma.$on('info', (e) => { logger.info({ prisma_target: e.target, prisma_message: e.message }, 'Prisma Info'); });

prisma.$on('warn', (e) => { logger.warn({ prisma_target: e.target, prisma_message: e.message }, 'Prisma Warn'); });

prisma.$on('error', (e) => { logger.error({ prisma_target: e.target, prisma_message: e.message }, 'Prisma Error'); });

// ... (disconnectPrisma, connectPrisma, export default prisma) ...
export const disconnectPrisma = async (): Promise<void> => { /* ... */ };
export const connectPrisma = async (): Promise<void> => { /* ... */ };
export default prisma;