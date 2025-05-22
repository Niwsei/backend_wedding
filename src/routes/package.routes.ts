// src/routes/package.routes.ts
import express from 'express';
import { validateRequest } from '../middleware/validateRequest';
import {
    GetAllPackagesQuerySchema,
    GetPackageParamsSchema,
    CreatePackageSchema,
    UpdatePackageSchema
} from '../schemas/package.schema';
import {
    getAllPackagesHandler,
    getPackageByIdHandler,
    createPackageHandler,
    updatePackageHandler,
    deletePackageHandler
} from '../controllers/package.controller';
import { authenticate } from '../middleware/authenticate';
import { authorizeRoles } from '../middleware/authorizeRoles';


const router = express.Router();

// --- Public Routes ---
router.get(
    '/',
    validateRequest({ query: GetAllPackagesQuerySchema.shape.query }),
    getAllPackagesHandler
);
router.get(
    '/:packageId',
    validateRequest({ params: GetPackageParamsSchema.shape.params }),
    getPackageByIdHandler
);

// --- Admin Routes ---
router.post(
    '/',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ body: CreatePackageSchema.shape.body }),
    createPackageHandler
);
router.put(
    '/:packageId',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ params: UpdatePackageSchema.shape.params, body: UpdatePackageSchema.shape.body }),
    updatePackageHandler
);
router.delete(
    '/:packageId',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ params: GetPackageParamsSchema.shape.params }),
    deletePackageHandler
);

export default router;