// src/routes/banner.routes.ts
import express from 'express';
import { validateRequest } from '../middleware/validateRequest';
import {
    GetAllBannersQuerySchema,
    CreateBannerSchema,
    UpdateBannerSchema,
    UpdateBannerParamsSchema
} from '../schemas/banner.schema';
import {
    getAllBannersHandler,
    createBannerHandler,
    getBannerByIdHandler, // Handler สำหรับ GET by ID (Admin)
    updateBannerHandler,
    deleteBannerHandler
} from '../controllers/banner.controller';
import { authenticate } from '../middleware/authenticate';
import { authorizeRoles } from '../middleware/authorizeRoles';

const router = express.Router();

// --- Public Route to get all active banners ---
router.get(
    '/',
    validateRequest({ query: GetAllBannersQuerySchema.shape.query }),
    getAllBannersHandler
);

// --- Admin Routes for managing banners ---
// GET a specific banner (Admin might need this)
router.get(
    '/:bannerId',
    authenticate, // อาจจะให้ Admin ดูได้เท่านั้น
    authorizeRoles(['admin']),
    validateRequest({ params: UpdateBannerParamsSchema.shape.params }),
    getBannerByIdHandler
);

router.post(
    '/',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ body: CreateBannerSchema.shape.body }),
    createBannerHandler
);

router.put(
    '/:bannerId',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ params: UpdateBannerSchema.shape.params, body: UpdateBannerSchema.shape.body }),
    updateBannerHandler
);

router.delete(
    '/:bannerId',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ params: UpdateBannerParamsSchema.shape.params }),
    deleteBannerHandler
);

export default router;