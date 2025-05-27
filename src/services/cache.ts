// src/middleware/cache.ts
import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis'; // Import Redis client ของคุณ
import logger from '../utils/logger';

/**
 * Middleware to cache GET request responses in Redis.
 * @param durationInSeconds Time to live for the cache in seconds.
 */
export const cacheMiddleware = (durationInSeconds: number)  => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create a unique cache key based on the original URL (includes query params)
    const cacheKey = `cache:${req.originalUrl}`;
    let cachedData: string | null = null;

    try {
        if (redisClient.status === 'ready') { // ตรวจสอบสถานะ Redis ก่อน
            cachedData = await redisClient.get(cacheKey);
        } else {
            logger.warn({ key: cacheKey }, 'Redis not ready, skipping cache read.');
        }
    } catch (error) {
        logger.error({ err: error, key: cacheKey }, 'Error reading from Redis cache');
        // Proceed without cache on error
    }


    if (cachedData) {
      logger.debug({ key: cacheKey }, 'Serving response from Redis cache');
      try {
        const jsonData = JSON.parse(cachedData);
         res.status(200).json(jsonData); // Send cached data
         return;
      } catch (parseError) {
         logger.error({ err: parseError, key: cacheKey, data: cachedData }, 'Error parsing cached JSON data');
         // If parsing fails, proceed to fetch fresh data
         // Optionally, delete the invalid cache entry
         if (redisClient.status === 'ready') await redisClient.del(cacheKey).catch(delErr => logger.error({delErr}, "Failed to delete invalid cache"));
      }
    }

    // If no cache, or cache read/parse failed, proceed to the route handler
    // and cache the response
    const originalJson = res.json; // Intercept res.json
    let responseBody: any;

    res.json = (body): Response<any, Record<string, any>> => {
      responseBody = body; // Capture the body
      return originalJson.call(res, body); // Call original res.json
    };

    // After the response is sent, try to cache it if it was successful (2xx)
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300 && responseBody) {
        try {
            if (redisClient.status === 'ready') {
                await redisClient.setex(cacheKey, durationInSeconds, JSON.stringify(responseBody));
                logger.debug({ key: cacheKey, duration: durationInSeconds }, 'Response cached in Redis');
            } else {
                logger.warn({ key: cacheKey }, 'Redis not ready, skipping cache write.');
            }
        } catch (error) {
          logger.error({ err: error, key: cacheKey }, 'Error writing to Redis cache');
        }
      }
    });

    next();
  };
};