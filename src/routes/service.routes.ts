// src/routes/service.routes.ts
import express from 'express';
import { validateRequest } from '../middleware/validateRequest';
import {
    GetAllServicesQuerySchema,
    GetServiceParamsSchema,
    CreateServiceSchema,
    UpdateServiceSchema
} from '../schemas/service.schema';
import {
    getAllServicesHandler,
    getServiceByIdHandler,
    createServiceHandler,
    updateServiceHandler,
    deleteServiceHandler
} from '../controllers/service.controller';
import { authenticate } from '../middleware/authenticate'; // Import authenticate
import { authorizeRoles } from '../middleware/authorizeRoles';
import { cacheMiddleware } from '../services/cache';

const router = express.Router();



const SERVICE_LIST_CACHE_TTL = 60 * 5; // Cache list for 5 minutes
const SERVICE_DETAIL_CACHE_TTL = 60 * 30; // Cache detail for 30 minutes

// --- Public Routes ---
router.get(
    '/',
    cacheMiddleware(SERVICE_LIST_CACHE_TTL),
    validateRequest({ query: GetAllServicesQuerySchema.shape.query }), // Validate query params
    getAllServicesHandler
);

router.get(
    '/:serviceId',
    cacheMiddleware(SERVICE_DETAIL_CACHE_TTL),
    validateRequest({ params: GetServiceParamsSchema.shape.params }), // Validate route param
    getServiceByIdHandler
);


// --- Admin Routes (ตัวอย่าง - ต้องมี authenticate และ authorizeRoles) ---
// router.use(authenticate); // ทุก Route ข้างล่างนี้ต้อง Login
// router.use(authorizeRoles('admin')); // เฉพาะ Admin เท่านั้น

router.post(
    '/',
    authenticate, // ตัวอย่างการใช้ middleware ต่อกัน
     authorizeRoles(['admin']),
    validateRequest({ body: CreateServiceSchema.shape.body }),
    createServiceHandler
);

router.put(
    '/:serviceId',
    authenticate,
     authorizeRoles(['admin']),
    validateRequest({ params: UpdateServiceSchema.shape.params, body: UpdateServiceSchema.shape.body }),
    updateServiceHandler
);

router.delete(
    '/:serviceId',
    authenticate,
     authorizeRoles(['admin']),
    validateRequest({ params: GetServiceParamsSchema.shape.params }),
    deleteServiceHandler
);


// Admin อาจจะต้องการ GET by ID ที่เห็น is_active=false ด้วย (ถ้ามี Controller แยก)
// router.get(
//     '/admin/:serviceId',
//     authenticate,
//     authorizeRoles(['admin']),
//     validateRequest({ params: GetServiceParamsSchema.shape.params }),
//     getAdminServiceByIdHandler // สร้าง Handler นี้เพิ่ม
// );

export default router;