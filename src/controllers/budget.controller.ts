// src/controllers/budget.controller.ts
import { Request, Response, NextFunction } from 'express';
import BadRequestError from '../errors/badRequestError';
import pool from '../config/db';
import {
    getUserBudgetOverview,
    updateUserBudgetCategorySpent
} from '../services/budget.service';
import { UpdateBudgetCategorySpentInput, UpdateBudgetCategorySpentParams } from '../schemas/budget.schema';
import logger from '../utils/logger';

export const getMyBudgetOverviewHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) return next(new Error('User ID not found in request (authentication error)'));

    try {
        const budgetOverview = await getUserBudgetOverview(pool, userId);
         res.status(200).json({ status: 'success', data: budgetOverview });
    } catch (error) {
        return next(error);
    }
};

// ใน src/controllers/budget.controller.ts
export const updateMyBudgetCategoryHandler = async (
    req: Request, // <-- ลองเปลี่ยนเป็น Request แบบกว้างๆ ก่อน
    res: Response,
    next: NextFunction
): Promise<void> => {
    const userId = req.user?.userId;
    // ***** ต้อง Cast Type หรือ Validate เองถ้า req.params.categoryId เป็น string *****
    const categoryId = parseInt(req.params.categoryId as string, 10); // <--- Cast และ Parse
    const bodyData = req.body as UpdateBudgetCategorySpentInput;     // <--- Cast Body

    if (!userId) return next(new Error('User ID not found in request (authentication error)'));
    if (isNaN(categoryId) || categoryId <= 0) { // Validate categoryId ที่ parse มา
         return next(new BadRequestError('Invalid Category ID in path parameter'));
    }

    try {
        // ส่ง categoryId ที่เป็น number และ bodyData ที่ cast type แล้ว
        const updatedCategoryData = await updateUserBudgetCategorySpent(pool, userId, categoryId, bodyData);
         res.status(200).json({ status: 'success', data: { category: updatedCategoryData } });
    } catch (error) {
        return next(error);
    }
};