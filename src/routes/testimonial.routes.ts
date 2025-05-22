// src/routes/testimonial.routes.ts
import express from 'express';
import { validateRequest } from '../middleware/validateRequest';
import {
    GetAllTestimonialsQuerySchema,
    CreateTestimonialSchema,
    UpdateTestimonialSchema,
    UpdateTestimonialParamsSchema
} from '../schemas/testimonial.schema';
import {
    getAllTestimonialsHandler,
    createTestimonialHandler,
    getTestimonialByIdHandler,
    updateTestimonialHandler,
    deleteTestimonialHandler
} from '../controllers/testimonial.controller';
import { authenticate } from '../middleware/authenticate';
import { authorizeRoles } from '../middleware/authorizeRoles'; // Import authorizeRoles

const router = express.Router();

// --- Public Route to get all approved testimonials ---
router.get(
    '/',
    validateRequest({ query: GetAllTestimonialsQuerySchema.shape.query }),
    getAllTestimonialsHandler
);

// --- Admin Routes for managing testimonials ---
router.get(
    '/:testimonialId',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ params: UpdateTestimonialParamsSchema.shape.params }),
    getTestimonialByIdHandler
);

router.post(
    '/',
    authenticate,
    authorizeRoles(['admin']), // หรืออาจจะให้ User ส่ง Testimonial ได้ แล้ว Admin ค่อย Approve
    validateRequest({ body: CreateTestimonialSchema.shape.body }),
    createTestimonialHandler
);

router.put(
    '/:testimonialId',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ params: UpdateTestimonialSchema.shape.params, body: UpdateTestimonialSchema.shape.body }),
    updateTestimonialHandler
);

router.delete(
    '/:testimonialId',
    authenticate,
    authorizeRoles(['admin']),
    validateRequest({ params: UpdateTestimonialParamsSchema.shape.params }),
    deleteTestimonialHandler
);

export default router;