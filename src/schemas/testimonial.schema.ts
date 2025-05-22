// src/schemas/testimonial.schema.ts
import { z } from 'zod';

export const GetAllTestimonialsQuerySchema = z.object({
  query: z.object({
    isApproved: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
    // limit: z.coerce.number().int().positive().optional(),
    // sortBy: z.enum(['submitted_at_desc', 'rating_desc']).optional().default('submitted_at_desc'),
  }).optional(),
});
export type GetAllTestimonialsQuery = z.infer<typeof GetAllTestimonialsQuerySchema>['query'];

export const CreateTestimonialSchema = z.object({
    body: z.object({
        coupleName: z.string().min(1, 'Couple name is required').trim(),
        photoUrl: z.string().url('Invalid photo URL format').optional().nullable(),
        rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
        quote: z.string().min(10, 'Quote must be at least 10 characters').trim(),
        weddingDate: z.string().datetime({ offset: true, message: "Invalid wedding date format." }).optional().nullable(),
        isApproved: z.boolean().optional().default(false), // Admin จะเป็นคน Approve
    }),
});
export type CreateTestimonialInput = z.infer<typeof CreateTestimonialSchema>['body'];

export const UpdateTestimonialParamsSchema = z.object({
    params: z.object({
        testimonialId: z.coerce.number().int().positive(),
    }),
});
export type UpdateTestimonialParams = z.infer<typeof UpdateTestimonialParamsSchema>['params'];

export const UpdateTestimonialSchema = z.object({
    body: CreateTestimonialSchema.shape.body.partial().refine(data => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update.", path: ["body"],
    }),
    params: UpdateTestimonialParamsSchema.shape.params,
});
export type UpdateTestimonialInput = z.infer<typeof UpdateTestimonialSchema>['body'];