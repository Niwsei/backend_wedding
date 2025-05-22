// src/schemas/package.schema.ts
import { z } from 'zod';

export const GetPackageParamsSchema = z.object({
  params: z.object({
    packageId: z.coerce.number().int().positive('Package ID must be a positive integer'),
  }),
});
export type GetPackageParams = z.infer<typeof GetPackageParamsSchema>['params'];

export const GetAllPackagesQuerySchema = z.object({
  query: z.object({
    isPopular: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
    isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
    // page: z.coerce.number().int().positive().optional().default(1),
    // limit: z.coerce.number().int().positive().optional().default(10),
  }).optional(),
});
export type GetAllPackagesQuery = z.infer<typeof GetAllPackagesQuerySchema>['query'];

// Schema สำหรับ Service ที่จะอยู่ใน Package ตอน Create/Update
const IncludedServiceSchema = z.object({
    service_id: z.number().int().positive(),
    // อาจจะมี field อื่นๆ ที่ต้องการส่งมาตอนสร้าง/อัปเดต package-service relationship
    // เช่น custom_notes_for_service_in_package: z.string().optional()
});

export const CreatePackageSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Package name is required').trim(),
        description: z.string().optional().nullable(),
        price: z.number().min(0, 'Price cannot be negative'),
        coverImageUrl: z.string().url('Invalid cover image URL').optional().nullable(),
        isPopular: z.boolean().optional().default(false),
        isActive: z.boolean().optional().default(true),
        // Array ของ Service IDs หรือ Object ที่มี Service ID เพื่อรวมใน Package
        includedServices: z.array(z.number().int().positive("Each service ID must be a positive integer")).optional().default([]),
        // หรือถ้าซับซ้อนกว่า: includedServices: z.array(IncludedServiceSchema).optional().default([]),
    }),
});
export type CreatePackageInput = z.infer<typeof CreatePackageSchema>['body'];

export const UpdatePackageSchema = z.object({
    body: CreatePackageSchema.shape.body.partial().refine(data => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update.", path: ["body"],
    }),
    params: GetPackageParamsSchema.shape.params,
});
export type UpdatePackageInput = z.infer<typeof UpdatePackageSchema>['body'];
export type UpdatePackageParams = z.infer<typeof UpdatePackageSchema>['params']