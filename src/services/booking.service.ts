// src/services/booking.service.ts
import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import logger from '../utils/logger';
import ApiError from '../errors/apiError';
import NotFoundError from '../errors/notFoundError';
import BadRequestError from '../errors/badRequestError';
import { CreateBookingInput, GetAllBookingsQuery, UpdateBookingInput } from '../schemas/booking.schema';

export interface Booking extends RowDataPacket {
    booking_id: number;
    user_id: number;
    service_id: number | null;
    package_id: number | null;
    booking_type: string ; // ควรจะตรงกับ BookingTypeEnum
    title: string; // อาจจะดึงมาจาก Service/Package หรือ Generate
    booking_datetime: Date;
    location_type: string | null;
    location_details: string | null;
    status: string ; // ควรจะตรงกับ BookingStatusEnum
    notes: string | null;
    created_at: Date;
    updated_at: Date; // เพิ่มคอลัมน์นี้ใน DB ถ้ายังไม่มี
    // อาจจะ JOIN ข้อมูล Service Name / Package Name มาด้วยถ้าต้องการ
    service_name?: string;
    package_name?: string;
    sortBy?: 'booking_datetime_asc' | 'booking_datetime_desc' | 'created_at_desc';
}



/**
 * สร้าง Booking ใหม่สำหรับ User
 */
export const createBooking = async (pool: Pool, userId: number, input: CreateBookingInput): Promise<Booking> => {
    const { serviceId, packageId, bookingType, bookingDatetime, locationType, locationDetails, notes } = input;
    let bookingTitle = `${bookingType} Booking`; // Default title

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // ตรวจสอบความถูกต้องของ serviceId / packageId (ถ้ามี)
        if (serviceId) {
            const [serviceCheck] = await connection.query<RowDataPacket[]>('SELECT name FROM Services WHERE service_id = ? AND is_active = TRUE', [serviceId]);
            if (serviceCheck.length === 0) {
                await connection.rollback();
                throw new NotFoundError(`Service with ID ${serviceId} not found or is not active.`);
            }
            bookingTitle = serviceCheck[0].name ? `${serviceCheck[0].name} (${bookingType})` : bookingTitle;
        } else if (packageId) {
            const [packageCheck] = await connection.query<RowDataPacket[]>('SELECT name FROM Packages WHERE package_id = ? AND is_active = TRUE', [packageId]);
            if (packageCheck.length === 0) {
                await connection.rollback();
                throw new NotFoundError(`Package with ID ${packageId} not found or is not active.`);
            }
            bookingTitle = packageCheck[0].name ? `${packageCheck[0].name} (${bookingType})` : bookingTitle;
        }

        // TODO: อาจจะมี Logic ตรวจสอบช่วงเวลาที่จองว่าว่างหรือไม่ (ซับซ้อนขึ้น)

        const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO Bookings
             (user_id, service_id, package_id, booking_type, title, booking_datetime, location_type, location_details, status, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                serviceId,
                packageId,
                bookingType,
                bookingTitle, // ใช้ Title ที่ Generate
                new Date(bookingDatetime),
                locationType,
                locationDetails,
                'Pending', // สถานะเริ่มต้น
                notes,
            ]
        );
        const bookingId = result.insertId;
        if (!bookingId) {
            await connection.rollback();
            throw new ApiError(500, 'Failed to create booking.', false);
        }

        await connection.commit();
        logger.info({ bookingId, userId, bookingType }, 'Booking created successfully');

        // ดึง Booking ที่เพิ่งสร้างกลับมา
        const newBooking = await getBookingById(pool, userId, bookingId); // สร้าง function นี้
        if (!newBooking) throw new ApiError(500, 'Failed to retrieve newly created booking.', false); // ไม่ควรเกิดขึ้น
        return newBooking;

    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, userId, input }, 'Error creating booking');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not create booking due to a server error', false);
    } finally {
        connection.release();
    }
};

/**
 * ดึงรายการ Bookings ทั้งหมดของ User (พร้อม Filter พื้นฐาน)
 */
export const getUserBookings = async (pool: Pool, userId: number, queryParams?: GetAllBookingsQuery): Promise<Booking[]> => {
    logger.debug({ userId, queryParams }, 'Fetching bookings for user');
    // SELECT b.*, s.name as service_name, p.name as package_name
    // FROM Bookings b
    // LEFT JOIN Services s ON b.service_id = s.service_id
    // LEFT JOIN Packages p ON b.package_id = p.package_id
    // WHERE b.user_id = ? ...
    let sql = `
        SELECT
            b.booking_id, b.user_id, b.service_id, b.package_id, b.booking_type, b.title,
            b.booking_datetime, b.location_type, b.location_details, b.status, b.notes,
            b.created_at, b.updated_at,
            s.name AS service_name,
            p.name AS package_name
        FROM Bookings b
        LEFT JOIN Services s ON b.service_id = s.service_id
        LEFT JOIN Packages p ON b.package_id = p.package_id
    `;
    const params: any[] = [userId];
    const whereClauses: string[] = ['b.user_id = ?'];

    if (queryParams?.status) {
        whereClauses.push('b.status = ?');
        params.push(queryParams.status);
    }
    if (queryParams?.bookingType) {
        whereClauses.push('b.booking_type = ?');
        params.push(queryParams.bookingType);
    }
    // TODO: Add date range filtering

    if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    const sortBy = queryParams?.sortBy || 'booking_datetime_asc'; // Default sort
    if (sortBy === 'booking_datetime_asc') sql += ` ORDER BY b.booking_datetime ASC`;
    else if (sortBy === 'booking_datetime_desc') sql += ` ORDER BY b.booking_datetime DESC`;
    else if (sortBy === 'created_at_desc') sql += ` ORDER BY b.created_at DESC`;
    // TODO: Add pagination

    try {
        const [rows] = await pool.query<Booking[]>(sql, params);
        return rows;
    } catch (error: any) {
        logger.error({ err: error, userId, queryParams }, 'Error fetching user bookings');
        throw new ApiError(500, 'Could not retrieve bookings due to a server error', false);
    }
};

/**
 * ดึงข้อมูล Booking เฉพาะตัวตาม ID (ตรวจสอบว่าเป็นของ User คนนั้น)
 */
export const getBookingById = async (pool: Pool, userId: number, bookingId: number): Promise<Booking | null> => {
    logger.debug({ userId, bookingId }, 'Fetching booking by ID for user');
    try {
        const [rows] = await pool.query<Booking[]>(
            `SELECT
                b.*, s.name AS service_name, p.name AS package_name
             FROM Bookings b
             LEFT JOIN Services s ON b.service_id = s.service_id
             LEFT JOIN Packages p ON b.package_id = p.package_id
             WHERE b.booking_id = ? AND b.user_id = ? LIMIT 1`,
            [bookingId, userId]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
        logger.error({ err: error, userId, bookingId }, 'Error fetching booking by ID');
        throw new ApiError(500, 'Could not retrieve booking details due to a server error', false);
    }
};


/**
 * อัปเดต Booking (ตัวอย่างการอัปเดต status และ notes)
 */
export const updateBookingById = async (
    pool: Pool,
    userId: number,
    bookingId: number,
    input: UpdateBookingInput
): Promise<Booking> => {
    logger.debug({ userId, bookingId, input }, 'Updating booking');

    const fieldsToUpdate: { [key: string]: any } = {};
    const queryParams: any[] = [];
    const fieldMap: { [key in keyof UpdateBookingInput]?: string } = {
        bookingDatetime: 'booking_datetime',
        status: 'status',
        locationDetails: 'location_details',
        notes: 'notes',
    };

    for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key) && input[key as keyof UpdateBookingInput] !== undefined) {
            const dbField = fieldMap[key as keyof UpdateBookingInput];
            if (dbField) {
                 fieldsToUpdate[dbField] = (dbField === 'bookingDatetime' && input.bookingDatetime)
                                            ? new Date(input.bookingDatetime)
                                            : input[key as keyof UpdateBookingInput];
            }
        }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
        logger.warn({ userId, bookingId }, 'No valid fields provided for booking update.');
        const currentBooking = await getBookingById(pool, userId, bookingId);
        if (!currentBooking) throw new NotFoundError('Booking not found for update (no fields).');
        return currentBooking;
    }

    const setClauses = Object.keys(fieldsToUpdate).map(field => `${field} = ?`).join(', ');
    queryParams.push(...Object.values(fieldsToUpdate));
    queryParams.push(bookingId);
    queryParams.push(userId); // เพื่อความปลอดภัย
    const sql = `UPDATE Bookings SET ${setClauses}, updated_at = NOW() WHERE booking_id = ? AND user_id = ?`;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query<ResultSetHeader>(sql, queryParams);
        if (result.affectedRows === 0) {
            await connection.rollback();
            throw new NotFoundError('Booking not found or you do not have permission to update it.');
        }
        await connection.commit();
        logger.info({ userId, bookingId }, 'Booking updated successfully');
        const updatedBooking = await getBookingById(pool, userId, bookingId);
        if (!updatedBooking) throw new ApiError(500, 'Failed to retrieve updated booking.', false);
        return updatedBooking;
    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, userId, bookingId, input }, 'Error updating booking');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not update booking due to a server error', false);
    } finally {
        connection.release();
    }
};

/**
 * ยกเลิก Booking โดย User (เปลี่ยน Status เป็น CancelledByUser)
 */
export const cancelBookingByUser = async (pool: Pool, userId: number, bookingId: number): Promise<Booking> => {
    logger.debug({ userId, bookingId }, 'User cancelling booking');
    // ตรวจสอบว่า Booking สามารถยกเลิกได้หรือไม่ (เช่น ยังไม่ถึงวันงาน, สถานะเป็น Confirmed)
    const currentBooking = await getBookingById(pool, userId, bookingId);
    if (!currentBooking) {
        throw new NotFoundError('Booking not found or does not belong to this user.');
    }
    if (currentBooking.status === 'Completed' || currentBooking.status === 'CancelledByUser' || currentBooking.status === 'CancelledByAdmin') {
        throw new BadRequestError(`Booking cannot be cancelled as it is already ${currentBooking.status.toLowerCase()}.`);
    }
    // เพิ่ม Logic ตรวจสอบเงื่อนไขการยกเลิกอื่นๆ

    return updateBookingById(pool, userId, bookingId, { status: 'CancelledByUser' });
};