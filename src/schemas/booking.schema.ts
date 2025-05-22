// src/schemas/booking.schema.ts
import { z } from 'zod';

// Enum สำหรับ Booking Type และ Status (เพื่อให้ Validate ได้ง่ายขึ้น)
export const BookingTypeEnum = z.enum([
    'Consultation',
    'VenueVisit',
    'TastingSession',
    'WeddingEvent', // การจองวันงานจริง
    'PackageBooking',
    'ServiceBooking',
    'Other'
]);

export const BookingStatusEnum = z.enum([
    'Pending',      // รอการยืนยัน (อาจจะจาก Admin หรือ User)
    'Confirmed',    // ยืนยันแล้ว
    'CancelledByUser',
    'CancelledByAdmin',
    'Completed',
    'Rescheduled',
    'PaymentPending' // ถ้ามีเรื่องการจ่ายเงิน
]);


export const CreateBookingSchema = z.object({
  body: z.object({
    serviceId: z.number().int().positive().optional().nullable(),
    packageId: z.number().int().positive().optional().nullable(),
    bookingType: BookingTypeEnum,
    // title: z.string().min(1, 'Booking title is required').trim(), // Title อาจจะ Generate จาก Service/Package
    bookingDatetime: z.string().datetime({ offset: true, message: "Invalid booking date/time format. Use ISO 8601." }),
    locationType: z.enum(['Physical', 'VideoCall', 'ToBeDetermined']).optional().nullable(),
    locationDetails: z.string().trim().optional().nullable(), // เช่น ที่อยู่, Link Google Meet
    notes: z.string().trim().optional().nullable(),
  }).refine(data => data.serviceId || data.packageId || data.bookingType === 'Other' || data.bookingType === 'Consultation', {
    // ตรวจสอบว่ามีการระบุ serviceId หรือ packageId หรือเป็น type ที่ไม่ต้องมี (เช่น Consultation, Other)
    message: "Either serviceId, packageId must be provided, or bookingType must be 'Other' or 'Consultation'.",
    path: ["serviceId", "packageId"], // path ของ error (อาจจะปรับ)
  }),
});
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>['body'];


export const GetBookingParamsSchema = z.object({
  params: z.object({
    bookingId: z.coerce.number().int().positive('Booking ID must be a positive integer'),
  }),
});
export type GetBookingParams = z.infer<typeof GetBookingParamsSchema>['params'];


export const GetAllBookingsQuerySchema = z.object({
  query: z.object({
    status: BookingStatusEnum.optional(),
    bookingType: BookingTypeEnum.optional(),
    // dateFrom: z.string().datetime({ offset: true }).optional(),
    // dateTo: z.string().datetime({ offset: true }).optional(),
     sortBy: z.enum(['booking_datetime_asc', 'booking_datetime_desc', 'created_at_desc']).optional().default('booking_datetime_asc'),
    // page: z.coerce.number().int().positive().optional().default(1),
    // limit: z.coerce.number().int().positive().optional().default(10),
  }).optional(),
});
export type GetAllBookingsQuery = z.infer<typeof GetAllBookingsQuerySchema>['query'];

// Schema สำหรับ Update Booking (ตัวอย่างเบื้องต้น)
export const UpdateBookingSchema = z.object({
    body: z.object({
        bookingDatetime: z.string().datetime({ offset: true }).optional(),
        status: BookingStatusEnum.optional(),
        locationDetails: z.string().trim().optional().nullable(),
        notes: z.string().trim().optional().nullable(),
    }).refine(data => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update.", path: ["body"],
    }),
    params: GetBookingParamsSchema.shape.params,
});
export type UpdateBookingInput = z.infer<typeof UpdateBookingSchema>['body'];