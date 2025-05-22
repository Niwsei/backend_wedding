// src/controllers/inspiration.controller.ts
import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import {
    getUserSavedInspirations,
    saveInspirationForItem,
    deleteInspirationForItem
} from '../services/inspiration.service';
import { InspirationParams } from '../schemas/inspiration.schema';
import logger from '../utils/logger';
import BadRequestError from '../errors/badRequestError';

export const getMyInspirationsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) return next(new Error('User ID not found in request (authentication error)'));

    try {
        const inspirations = await getUserSavedInspirations(pool, userId);
         res.status(200).json({ status: 'success', data: { inspirations } });
    } catch (error: any) {
        return next(error);
    }
};

export const saveInspirationHandler = async (
    req: Request, // รับ itemId จาก params
    res: Response,
    next: NextFunction
): Promise<void> => {
    const userId = req.user?.userId;
   const itemIdString = req.params.itemId; // itemId จะเป็น string จาก req.params

    if (!userId) return next(new Error('User ID not found in request (authentication error)'));
      // Validate itemId ที่ Controller อีกครั้ง (Optional แต่ดี)
    // หรือมั่นใจว่า validateRequest middleware ทำงานถูกต้องแล้ว
    const itemId = parseInt(itemIdString, 10);
    if (isNaN(itemId) || itemId <= 0) {
        return next(new BadRequestError('Invalid Gallery Item ID in path parameter.'));
    }

    try {
        const result = await saveInspirationForItem(pool, userId, itemId);
        // อาจจะคืน status 201 ถ้าเป็นการสร้างใหม่, 200 ถ้ามีอยู่แล้ว
         res.status(result.message.includes("already saved") ? 200 : 201).json({ status: 'success', message: result.message, data: result.inspiration ? { inspiration: result.inspiration } : undefined });
    } catch (error: any) {
        return next(error);
    }
};


export const deleteInspirationHandler = async (
    req: Request, // รับ itemId จาก params
    res: Response,
    next: NextFunction
): Promise<void> => {
    const userId = req.user?.userId;
 const itemIdString = req.params.itemId; // itemId จะเป็น string จาก req.params

    if (!userId) return next(new Error('User ID not found in request (authentication error)'));
    // Validate itemId ที่ Controller อีกครั้ง (Optional แต่ดี)
    // หรือมั่นใจว่า validateRequest middleware ทำงานถูกต้องแล้ว
    const itemId = parseInt(itemIdString, 10);
    if (isNaN(itemId) || itemId <= 0) {
        return next(new BadRequestError('Invalid Gallery Item ID in path parameter.'));
    }

    try {
        const result = await deleteInspirationForItem(pool, userId, itemId);
         res.status(200).json({ status: 'success', message: result.message }); // หรือ 204 No Content
    } catch (error: any) {
        return next(error);
    }
};