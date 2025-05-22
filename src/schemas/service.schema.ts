// src/schemas/service.schema.ts
import { z } from 'zod';

// Schema สำหรับ Route Parameter :serviceId
export const GetServiceParamsSchema = z.object({
  params: z.object({
    serviceId: z.coerce.number().int().positive('Service ID must be a positive integer'),
  }),
});
export type GetServiceParams = z.infer<typeof GetServiceParamsSchema>['params'];

// Schema สำหรับ Query Parameters ของ GET /api/services
export const GetAllServicesQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(), // Filter by category
    isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined), // Filter by active status
    // page: z.coerce.number().int().positive().optional().default(1),
    // limit: z.coerce.number().int().positive().optional().default(10),
    // sortBy: z.string().optional(), // e.g., 'name_asc', 'price_desc'
  }).optional(), // ทำให้ query ทั้งก้อนเป็น optional
});
export type GetAllServicesQuery = z.infer<typeof GetAllServicesQuerySchema>['query'];


// --- Schemas สำหรับ Create/Update (สำหรับ Admin ในอนาคต) ---
export const CreateServiceSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Service name is required').trim(),
        description: z.string().optional().nullable(),
        category: z.string().optional().nullable(),
        basePrice: z.number().min(0, 'Base price cannot be negative').optional().nullable(),
        coverImageUrl: z.string().url('Invalid cover image URL').optional().nullable(),
        iconUrl: z.string().url('Invalid icon URL').optional().nullable(),
        isActive: z.boolean().optional().default(true),
        features: z.array(z.string().min(1).trim()).optional(), // Array of feature names
    }),
});
export type CreateServiceInput = z.infer<typeof CreateServiceSchema>['body'];

export const UpdateServiceSchema = z.object({
    body: CreateServiceSchema.shape.body.partial().refine(data => Object.keys(data).length > 0, { // Partial และต้องมีอย่างน้อย 1 field
        message: "At least one field must be provided for update.",
        path: ["body"],
    }),
    params: GetServiceParamsSchema.shape.params, // ใช้ params เดิม
});
export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>['body'];
export type UpdateServiceParams = z.infer<typeof UpdateServiceSchema>['params']