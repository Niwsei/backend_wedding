import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import config from './config';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import logger, { addRequestId, requestLogger } from './utils/logger';
import { setupSwagger } from './config/swagger';
import path from 'path';

const app: express.Express = express();


app.use(addRequestId)
app.use(requestLogger)

// Core Middleware
app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));


app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

if (config.NODE_ENV !== 'production') { // แสดง Docs เฉพาะใน Non-Production
    setupSwagger(app);
}

// Request Logging
app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`REQ: ${req.method} ${req.originalUrl} - Body: ${req.method !== 'GET' ? JSON.stringify(req.body) : ''}`); // Log body carefully
    const start = Date.now();
    res.on('finish', () => {
        logger.info(`RES: ${req.method} ${req.originalUrl} ${res.statusCode} [${Date.now() - start}ms]`);
    });
    next();
});

// API Routes
app.use('/api', apiRouter);

// Base Route
app.get('/', (req, res) => { // ไม่ต้องใส่ Type Request, Response ที่นี่แล้ว
  res.send('Blissful Weddings Backend is Running!');
});

// 404 Handler
app.use('*', (req, res) => { // ไม่ต้องใส่ Type Request, Response
    const requestId = (req as any).id || req.headers['x-request-id']; // ดึง requestId มา log
    logger.warn({ requestId, method: req.method, url: req.originalUrl }, `404 Not Found`);
    res.status(404).json({ status: 'fail', message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use(errorHandler);

export default app;