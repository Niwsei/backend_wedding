// src/routes/offer.routes.ts
import express from 'express';
import { validateRequest } from '../middleware/validateRequest';
import {
    GetAllOffersQuerySchema,
    CreateOfferSchema,
    UpdateOfferSchema,
    UpdateOfferParamsSchema
} from '../schemas/offer.schema';
import {
    getAllOffersHandler,
    createOfferHandler,
    getOfferByIdHandler,
    updateOfferHandler,
    deleteOfferHandler
} from '../controllers/offer.controller';
import { authenticate } from '../middleware/authenticate';
import { authorizeRoles } from '../middleware/authorizeRoles'; // Import authorizeRoles
// import { authorizeRoles } from '../middleware/authorizeRoles';

const router = express.Router();

// --- Public Route to get all active offers ---
router.get(
    '/',
    validateRequest({ query: GetAllOffersQuerySchema.shape.query }),
    getAllOffersHandler
);

// --- Admin Routes for managing offers ---
router.get(
    '/:offerId',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ params: UpdateOfferParamsSchema.shape.params }),
    getOfferByIdHandler
);

router.post(
    '/',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ body: CreateOfferSchema.shape.body }),
    createOfferHandler
);

router.put(
    '/:offerId',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ params: UpdateOfferSchema.shape.params, body: UpdateOfferSchema.shape.body }),
    updateOfferHandler
);

router.delete(
    '/:offerId',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ params: UpdateOfferParamsSchema.shape.params }),
    deleteOfferHandler
);

export default router;