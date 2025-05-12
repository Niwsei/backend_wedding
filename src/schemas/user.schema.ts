// src/schemas/user.schema.ts
import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').trim().optional(),
    username: z.string().min(4, 'Username must be at least 4 characters').trim().optional(),
    avatarUrl: z.string().url('Invalid URL format for avatar').optional().nullable(), // อนุญาตให้เป็น null (ลบรูป)
    weddingDate: z.string().datetime({ offset: true, message: "Invalid date format. Use ISO 8601" }).optional().nullable(),
    planningStatus: z.string().trim().optional().nullable(),
    totalBudget: z.number().positive('Budget must be a positive number').optional().nullable(),
    // ไม่รวม email, phone_number, password
  }).refine(data => Object.keys(data).length > 0, { // ตรวจสอบว่ามีข้อมูลส่งมาอัปเดตอย่างน้อย 1 field
    message: "At least one field must be provided for update.",
    path: ["body"], // path ของ error
  }),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>['body'];