import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import config from './config';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';

const app: Application = express();

// Core Middleware
app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

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
app.get('/', (req: Request, res: Response) => {
    res.status(200).send('Blissful Weddings Backend API v1.0')
});

// 404 Handler
app.use('*', (req: Request, res: Response) => {
    logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ status: 'fail', message: `The requested URL ${req.originalUrl} was not found on this server.` });
});

// Global Error Handler
app.use(errorHandler);

export default app;