import { z } from "zod";

// Schema สำหรับ Route Params (itemId)
export const InspirationParamsSchema = z.object({
    params: z.object ({
       itemId: z.coerce.number().int().positive('Gallery Item ID must be a positive integer'),
    })
})

export type InspirationParams = z.infer<typeof InspirationParamsSchema>['params']