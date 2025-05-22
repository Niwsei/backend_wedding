
import { z } from 'zod'

export const CreateTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1,   'Title is required').trim(),
    dueDescription: z.string().optional().nullable(), // เช่น "Due in 3 days"
    dueDate: z.string().datetime({ offset: true, message: "Invalid due date format. Use ISO 8601." }).optional().nullable(), // วันที่กำหนดส่งจริง (optional)
    notes: z.string().optional().nullable(),
    })
})

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>['body']

export const UpdateTaskSchema = z.object({
    body: z.object({
    title: z.string().min(1).trim().optional(),
    dueDescription: z.string().optional().nullable(),
    dueDate: z.string().datetime({ offset: true }).optional().nullable(),
    notes: z.string().optional().nullable(),
    isCompleted: z.boolean().optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update.",
    path: ["body"],
  }),
  params: z.object({ // สำหรับ route param :taskId
    taskId: z.coerce.number().int().positive('Task ID must be a positive integer'),
  })
})

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>['body']
export type UpdateTaskParams = z.infer<typeof UpdateTaskSchema>['params']

// Schema สำหรับ Get Tasks อาจจะไม่ต้องมี นอกจากจะ validate query params (เช่น filter, sort)
// Schema สำหรับ Delete Task (ใช้ params เหมือน UpdateTaskSchema)

export const TaskParamsSchema = z.object({
    params: z.object({
      taskId: z.coerce.number().int().positive('Task ID must be a positive integer'),
    })
})

export type TaskParams = z.infer<typeof TaskParamsSchema>['params'];