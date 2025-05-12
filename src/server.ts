import app from './app';
import config from './config';
import logger from './utils/logger';
import { closeDbPool } from './config/db';
import { closeRedisConnection } from './config/redis';

const port = config.PORT;

const server = app.listen(port, () => {
  logger.info(`Server environment: ${config.NODE_ENV}`);
  logger.info(`Server listening on http://localhost:${port}`); // More informative log
});

const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

signals.forEach((signal) => {
  process.on(signal, async () => {
    logger.info(`\nReceived ${signal}, shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await closeRedisConnection();
      await closeDbPool();
      logger.info('Resources closed. Exiting process.');
      process.exit(0); // Clean exit
    });

    // Force shutdown after timeout
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1); // Exit with error code
    }, 15000);
  });
});

process.on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
   logger.fatal({ err: reason }, 'Unhandled Rejection detected. Shutting down...');
   // Consider graceful shutdown here too, if possible
   process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
   logger.fatal({ err: error }, 'Uncaught Exception detected. Shutting down...');
   // Should exit, trying to recover is usually unsafe
   process.exit(1);
});