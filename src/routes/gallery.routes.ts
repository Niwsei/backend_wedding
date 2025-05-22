// src/routes/gallery.routes.ts
import express from 'express';
import { validateRequest } from '../middleware/validateRequest';
import {
    GetAllGalleryItemsQuerySchema,
    GetGalleryItemParamsSchema,
    CreateGalleryItemSchema,
    UpdateGalleryItemSchema
} from '../schemas/gallery.schema';
import {
    getAllGalleryItemsHandler,
    getGalleryItemByIdHandler,
    createGalleryItemHandler,
    updateGalleryItemHandler,
    deleteGalleryItemHandler
} from '../controllers/gallery.controller';
import { authenticate } from '../middleware/authenticate';
import { authorizeRoles } from '../middleware/authorizeRoles';

const router = express.Router();

// --- Public Routes ---
router.get(
    '/items', // เปลี่ยน path เป็น /items เพื่อความชัดเจน หรือใช้ / เฉยๆ ก็ได้
    validateRequest({ query: GetAllGalleryItemsQuerySchema.shape.query }),
    getAllGalleryItemsHandler
);
router.get(
    '/items/:itemId',
    validateRequest({ params: GetGalleryItemParamsSchema.shape.params }),
    getGalleryItemByIdHandler
);

// --- Admin Routes ---
router.post(
    '/items',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ body: CreateGalleryItemSchema.shape.body }),
    createGalleryItemHandler
);
router.put(
    '/items/:itemId',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ params: UpdateGalleryItemSchema.shape.params, body: UpdateGalleryItemSchema.shape.body }),
    updateGalleryItemHandler
);
router.delete(
    '/items/:itemId',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ params: GetGalleryItemParamsSchema.shape.params }),
    deleteGalleryItemHandler
);

export default router;