// src/controllers/service.controller.ts
import { Request, Response, NextFunction } from 'express';
import BadRequestError from '../errors/badRequestError';
import pool from '../config/db';
import {
    getAllServices,
    getServiceById,
    createService,
    updateServiceById,
    deleteServiceById
} from '../services/service.service';
import { GetAllServicesQuery, GetServiceParams, CreateServiceInput, UpdateServiceInput , UpdateServiceParams } from '../schemas/service.schema'; // Import GetServiceParams
import NotFoundError from '../errors/notFoundError';
import redisClient from '../config/redis';
import logger from '../utils/logger';



const clearServiceCache = async (serviceId?: number) => {
    const listKey = `cache:/api/services`; // Key หลักสำหรับ List (อาจจะต้องซับซ้อนกว่านี้ถ้ามี query params เยอะ)
    logger.debug({ keys: [listKey, serviceId ? `cache:/api/services/${serviceId}` : 'N/A'] }, 'Attempting to clear service cache');
    try {
        if (redisClient.status !== 'ready') {
            logger.warn('Redis not ready, skipping cache clear.');
            return;
        }
        const keysToDelete: string[] = [listKey]; // ลบ cache ของ list เสมอ
        if (serviceId) {
            keysToDelete.push(`cache:/api/services/${serviceId}`); // ลบ cache ของ detail ถ้ามี ID
        }
        // สำหรับ cache ที่มี query params อาจจะต้องใช้ SCAN และ DEL ที่ซับซ้อนขึ้น
        // หรือใช้ Tagging (ถ้า Redis version รองรับ หรือใช้ Library ช่วย)
        // วิธีง่ายๆ คือลบ Key ที่ตรงๆ ก่อน
        const deletedCount = await redisClient.del(keysToDelete);
        logger.info({ deletedCount, keys: keysToDelete }, 'Service cache cleared');
    } catch (error) {
        logger.error({ err: error }, 'Error clearing service cache');
    }
}

export const getAllServicesHandler = async (
    req: Request<{}, {}, {}, GetAllServicesQuery>, // Query params
    res: Response,
    next: NextFunction
) => {
    try {
        const services = await getAllServices(pool, req.query as GetAllServicesQuery);
         res.status(200).json({ status: 'success', results: services.length, data: { services } });
    } catch (error) {
        return next(error);
    }
};

export const getServiceByIdHandler = async (
    req: Request, // Route params
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const serviceIdString = req.params.serviceId;
         if (!serviceIdString) {
            return next(new BadRequestError('Service ID is missing in path parameters.'));
        }
        const serviceId = parseInt(serviceIdString, 10);
         if (isNaN(serviceId) || serviceId <= 0) {
            return next(new BadRequestError('Invalid Service ID format in path parameters.'));
        }
         const service = await getServiceById(pool, serviceId);
        if (!service) {
            return next(new NotFoundError('Service not found'));
        }
         res.status(200).json({ status: 'success', data: { service } });
    } catch (error) {
        return next(error);
    }
};


// --- Admin Handlers (ตัวอย่าง) ---
export const createServiceHandler = async (
    req: Request<{}, {}, CreateServiceInput, any>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const newService = await createService(pool, req.body);
        await clearServiceCache();
         res.status(201).json({ status: 'success', data: { service: newService } });
    } catch (error) {
        return next(error);
    }
};

export const updateServiceHandler = async (
    req: Request, // ใช้ Type จาก Schema
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const serviceIdString = req.params.serviceId;
        if (!serviceIdString) {
            return next(new BadRequestError('Service ID is missing in path parameters.'));
        }
        const serviceId = parseInt(serviceIdString, 10);
        if (isNaN(serviceId) || serviceId <= 0) {
            return next(new BadRequestError('Invalid Service ID format in path parameters.'));
        }
        const bodyData = req.body as UpdateServiceInput; // Cast type หลังจาก validate

        const updatedService = await updateServiceById(pool, serviceId, bodyData);
        await clearServiceCache(serviceId);

       res.status(200).json({ status: 'success', data: { service: updatedService } });
    } catch (error: any) {
        return next(error);
    }
};

export const deleteServiceHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
       const serviceIdString = req.params.serviceId;
        if (!serviceIdString) {
            return next(new BadRequestError('Service ID is missing in path parameters.'));
        }
        const serviceId = parseInt(serviceIdString, 10);
        if (isNaN(serviceId) || serviceId <= 0) {
            return next(new BadRequestError('Invalid Service ID format in path parameters.'));
        }

        const result = await deleteServiceById(pool, serviceId);
         await clearServiceCache(serviceId);
         res.status(200).json({ status: 'success', message: result.message });
    } catch (error) {
        return next(error);
    }
};