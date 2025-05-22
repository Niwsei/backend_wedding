// src/routes/inspiration.routes.ts
import express from 'express';
import { authenticate } from '../middleware/authenticate';
import { validateRequest } from '../middleware/validateRequest';
import { InspirationParamsSchema } from '../schemas/inspiration.schema';
import {
    getMyInspirationsHandler,
    saveInspirationHandler,
    deleteInspirationHandler
} from '../controllers/inspiration.controller';

const router = express.Router();

// ทุก Route ในนี้ต้องผ่านการ authenticate ก่อน
router.use(authenticate);

// GET /api/inspirations - ดึง Saved Inspirations ทั้งหมดของ User
router.get('/', getMyInspirationsHandler);

// POST /api/inspirations/:itemId - บันทึก (Like) Gallery Item
router.post(
    '/:itemId',
    validateRequest({ params: InspirationParamsSchema.shape.params }),
    saveInspirationHandler
);

// DELETE /api/inspirations/:itemId - ลบ (Unlike) Gallery Item
router.delete(
    '/:itemId',
    validateRequest({ params: InspirationParamsSchema.shape.params }),
    deleteInspirationHandler
);

export default router;