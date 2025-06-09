// src/schemas/banner.schema.ts
import { z } from 'zod';

export const GetAllBannersQuerySchema = z.object({
  query: z.object({
    isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
    // sortBy: z.enum(['sort_order_asc', 'sort_order_desc']).optional().default('sort_order_asc'),
    // limit: z.coerce.number().int().positive().optional(),
  }).optional(),
});
export type GetAllBannersQuery = z.infer<typeof GetAllBannersQuerySchema>['query'];

// --- Schemas สำหรับ Create/Update (Admin) ---
export const CreateBannerSchema = z.object({
    body: z.object({
        imageUrl: z.string().startsWith('/', "Image path must start with '/'"),
        title: z.string().optional().nullable(),
        subtitle: z.string().optional().nullable(),
        buttonText: z.string().optional().nullable(),
        buttonLink: z.string().url('Invalid button link URL').optional().nullable(),
        sortOrder: z.number().int().optional().default(0),
        isActive: z.boolean().optional().default(true),
    }),
});
export type CreateBannerInput = z.infer<typeof CreateBannerSchema>['body'];

export const UpdateBannerParamsSchema = z.object({
    params: z.object({
        bannerId: z.coerce.number().int().positive(),
    }),
});
export type UpdateBannerParams = z.infer<typeof UpdateBannerParamsSchema>['params'];

export const UpdateBannerSchema = z.object({
    body: CreateBannerSchema.shape.body.partial().refine(data => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update.", path: ["body"],
    }),
    params: UpdateBannerParamsSchema.shape.params,
});
export type UpdateBannerInput = z.infer<typeof UpdateBannerSchema>['body'];