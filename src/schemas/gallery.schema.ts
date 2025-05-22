// src/schemas/gallery.schema.ts
import { z } from 'zod';

export const GetGalleryItemParamsSchema = z.object({
  params: z.object({
    itemId: z.coerce.number().int().positive('Gallery Item ID must be a positive integer'),
  }),
});
export type GetGalleryItemParams = z.infer<typeof GetGalleryItemParamsSchema>['params'];

export const GetAllGalleryItemsQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    isFeatured: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
    isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
    // page: z.coerce.number().int().positive().optional().default(1),
    // limit: z.coerce.number().int().positive().optional().default(10),
    // sortBy: z.string().optional(), // e.g., 'uploaded_at_desc'
  }).optional(),
});
export type GetAllGalleryItemsQuery = z.infer<typeof GetAllGalleryItemsQuerySchema>['query'];

// --- Schemas สำหรับ Create/Update (Admin) ---
export const CreateGalleryItemSchema = z.object({
    body: z.object({
        imageUrl: z.string().url('Image URL is required and must be a valid URL'),
        videoUrl: z.string().url('Invalid video URL format').optional().nullable(),
        title: z.string().min(1, 'Title is required').trim().optional().nullable(), // ทำให้ optional เผื่อบางรูปไม่มี title
        description: z.string().optional().nullable(),
        collectionTag: z.string().optional().nullable(),
        category: z.string().optional().nullable(),
        eventDate: z.string().datetime({ offset: true, message: "Invalid event date format. Use ISO 8601." }).optional().nullable(),
        isFeatured: z.boolean().optional().default(false),
        isActive: z.boolean().optional().default(true),
    }),
});
export type CreateGalleryItemInput = z.infer<typeof CreateGalleryItemSchema>['body'];

export const UpdateGalleryItemSchema = z.object({
    body: CreateGalleryItemSchema.shape.body.partial().refine(data => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update.", path: ["body"],
    }),
    params: GetGalleryItemParamsSchema.shape.params,
});
export type UpdateGalleryItemInput = z.infer<typeof UpdateGalleryItemSchema>['body'];