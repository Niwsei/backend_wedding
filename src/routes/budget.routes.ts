// src/routes/budget.routes.ts
import express from 'express';
import { authenticate } from '../middleware/authenticate';
import { validateRequest } from '../middleware/validateRequest';
import { UpdateBudgetCategorySpentSchema } from '../schemas/budget.schema';
import {
    getMyBudgetOverviewHandler,
    updateMyBudgetCategoryHandler
} from '../controllers/budget.controller';

const router = express.Router();

// ทุก Route ในนี้ต้องผ่านการ authenticate ก่อน
router.use(authenticate);

// GET /api/budget/overview (หรือ /api/users/me/budget) - ดึง Budget Overview
router.get('/overview', getMyBudgetOverviewHandler);

// PUT /api/budget/categories/:categoryId - อัปเดตยอดใช้จ่ายใน Category
router.put(
    '/categories/:categoryId',
    validateRequest({
        params: UpdateBudgetCategorySpentSchema.shape.params,
        body: UpdateBudgetCategorySpentSchema.shape.body
    }),
    updateMyBudgetCategoryHandler
);

export default router;