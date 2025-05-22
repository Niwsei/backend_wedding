// src/schemas/offer.schema.ts
import { z } from 'zod';

export const GetAllOffersQuerySchema = z.object({
  query: z.object({
    isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
    // sortBy: z.enum(['valid_until_asc', 'valid_until_desc']).optional(),
    // limit: z.coerce.number().int().positive().optional(),
  }).optional(),
});
export type GetAllOffersQuery = z.infer<typeof GetAllOffersQuerySchema>['query'];

// --- Schemas สำหรับ Create/Update (Admin) ---
export const CreateOfferSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Offer title is required').trim(),
        description: z.string().optional().nullable(),
        iconUrl: z.string().url('Invalid icon URL format').optional().nullable(),
        discountDetails: z.string().optional().nullable(), // เช่น "20% off", "Free consultation"
        validFrom: z.string().datetime({ offset: true, message: "Invalid valid_from date format." }).optional().nullable(),
        validUntil: z.string().datetime({ offset: true, message: "Invalid valid_until date format." }).optional().nullable(),
        isActive: z.boolean().optional().default(true),
    }),
});
export type CreateOfferInput = z.infer<typeof CreateOfferSchema>['body'];

export const UpdateOfferParamsSchema = z.object({
    params: z.object({
        offerId: z.coerce.number().int().positive(),
    }),
});
export type UpdateOfferParams = z.infer<typeof UpdateOfferParamsSchema>['params'];

export const UpdateOfferSchema = z.object({
    body: CreateOfferSchema.shape.body.partial().refine(data => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update.", path: ["body"],
    }),
    params: UpdateOfferParamsSchema.shape.params,
});
export type UpdateOfferInput = z.infer<typeof UpdateOfferSchema>['body'];