// src/routes/event.routes.ts
import express from 'express';
import { validateRequest } from '../middleware/validateRequest';
import {
    GetAllEventsQuerySchema,
    CreateEventSchema,
    UpdateEventSchema,
    UpdateEventParamsSchema
} from '../schemas/event.schema';
import {
    getAllEventsHandler,
    createEventHandler,
    getEventByIdHandler,
    updateEventHandler,
    deleteEventHandler
} from '../controllers/event.controller';
import { authenticate } from '../middleware/authenticate';
import { authorizeRoles } from '../middleware/authorizeRoles';

const router = express.Router();

// --- Public Route to get all active and upcoming events ---
router.get(
    '/',
    validateRequest({ query: GetAllEventsQuerySchema.shape.query }),
    getAllEventsHandler
);

// --- Admin Routes for managing events ---
router.get(
    '/:eventId',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ params: UpdateEventParamsSchema.shape.params }),
    getEventByIdHandler
);
router.post(
    '/',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ body: CreateEventSchema.shape.body }),
    createEventHandler
);
router.put(
    '/:eventId',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ params: UpdateEventSchema.shape.params, body: UpdateEventSchema.shape.body }),
    updateEventHandler
);
router.delete(
    '/:eventId',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ params: UpdateEventParamsSchema.shape.params }),
    deleteEventHandler
);

export default router;