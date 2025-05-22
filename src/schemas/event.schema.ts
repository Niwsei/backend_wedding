// src/schemas/event.schema.ts
import { z } from 'zod';

export const GetAllEventsQuerySchema = z.object({
  query: z.object({
    isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
    // dateFrom: z.string().datetime({ offset: true }).optional(),
    // dateTo: z.string().datetime({ offset: true }).optional(),
    // sortBy: z.enum(['event_datetime_asc', 'event_datetime_desc']).optional().default('event_datetime_asc'),
  }).optional(),
});
export type GetAllEventsQuery = z.infer<typeof GetAllEventsQuerySchema>['query'];

export const CreateEventSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Event name is required').trim(),
        eventDatetime: z.string().datetime({ offset: true, message: "Invalid event date/time format." }),
        locationName: z.string().min(1, 'Location name is required').trim(),
        locationAddress: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        isActive: z.boolean().optional().default(true),
    }),
});
export type CreateEventInput = z.infer<typeof CreateEventSchema>['body'];

export const UpdateEventParamsSchema = z.object({
    params: z.object({
        eventId: z.coerce.number().int().positive(),
    }),
});
export type UpdateEventParams = z.infer<typeof UpdateEventParamsSchema>['params'];

export const UpdateEventSchema = z.object({
    body: CreateEventSchema.shape.body.partial().refine(data => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update.", path: ["body"],
    }),
    params: UpdateEventParamsSchema.shape.params,
});
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>['body'];