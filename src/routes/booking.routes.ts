// src/routes/booking.routes.ts
import express from 'express';
import { authenticate } from '../middleware/authenticate';
import { validateRequest } from '../middleware/validateRequest';
import {
    CreateBookingSchema,
    GetAllBookingsQuerySchema,
    GetBookingParamsSchema,
    UpdateBookingSchema
} from '../schemas/booking.schema';
import {
    createBookingHandler,
    getMyBookingsHandler,
    getMyBookingByIdHandler,
    updateMyBookingHandler,
    cancelMyBookingHandler
} from '../controllers/booking.controller';

const router = express.Router();

// ทุก Route ในนี้ต้องผ่านการ authenticate ก่อน
router.use(authenticate);

// POST /api/bookings - สร้าง Booking ใหม่
router.post('/', validateRequest({ body: CreateBookingSchema.shape.body }), createBookingHandler);

// GET /api/bookings - ดึงรายการ Bookings ของ User
router.get('/', validateRequest({ query: GetAllBookingsQuerySchema.shape.query }), getMyBookingsHandler);

// GET /api/bookings/:bookingId - ดึงรายละเอียด Booking
router.get(
    '/:bookingId',
    validateRequest({ params: GetBookingParamsSchema.shape.params }),
    getMyBookingByIdHandler
);

// PUT /api/bookings/:bookingId - อัปเดต Booking
router.put(
    '/:bookingId',
    validateRequest({ params: UpdateBookingSchema.shape.params, body: UpdateBookingSchema.shape.body }),
    updateMyBookingHandler
);

// PUT /api/bookings/:bookingId/cancel - ยกเลิก Booking (เป็นตัวอย่างการใช้ PUT สำหรับ Action)
// หรือจะใช้ DELETE /api/bookings/:bookingId ก็ได้ แต่ PUT อาจจะสื่อถึงการเปลี่ยน State มากกว่าลบถาวร
router.put(
    '/:bookingId/cancel',
    validateRequest({ params: GetBookingParamsSchema.shape.params }), // ไม่มี body สำหรับ cancel action นี้
    cancelMyBookingHandler
);

// DELETE /api/bookings/:bookingId (ถ้าต้องการลบจริง)
// router.delete(
//     '/:bookingId',
//     validateRequest({ params: GetBookingParamsSchema.shape.params }),
//     deleteMyBookingHandler // ต้องสร้าง handler นี้
// );

export default router;