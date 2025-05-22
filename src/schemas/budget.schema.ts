import { z } from "zod"; 

export const UpdateBudgetCategorySpentSchema = z.object({
    body: z.object({
        spentAmount: z.number().min(0, 'Spent amount cannot be negative')
         // notes: z.string().optional().nullable(), // อาจจะมี notes เพิ่มเติม
    }),
     params: z.object({
    categoryId: z.coerce.number().int().positive('Category ID must be a positive integer'),
  }),
})

export type UpdateBudgetCategorySpentInput = z.infer<typeof UpdateBudgetCategorySpentSchema>['body'];
export type UpdateBudgetCategorySpentParams = z.infer<typeof UpdateBudgetCategorySpentSchema>['params'];

// Schema สำหรับ Get Budget Overview อาจจะไม่ต้องมี นอกจากจะ validate query params