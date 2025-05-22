// src/services/testimonial.service.ts
import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import logger from '../utils/logger';
import ApiError from '../errors/apiError';
import NotFoundError from '../errors/notFoundError';
import { GetAllTestimonialsQuery, CreateTestimonialInput, UpdateTestimonialInput } from '../schemas/testimonial.schema';

export interface Testimonial extends RowDataPacket {
    testimonial_id: number;
    couple_name: string;
    photo_url: string | null;
    rating: number;
    quote: string;
    wedding_date: Date | null;
    is_approved: boolean;
    submitted_at: Date;
    // updated_at ถ้ามีในตาราง
}

/**
 * ดึงรายการ Testimonials ทั้งหมด (ปกติจะดึงเฉพาะ Approved)
 */
export const getAllTestimonials = async (pool: Pool, queryParams?: GetAllTestimonialsQuery): Promise<Testimonial[]> => {
    logger.debug({ queryParams }, 'Fetching all testimonials');
    let sql = `SELECT testimonial_id, couple_name, photo_url, rating, quote, wedding_date, is_approved, submitted_at FROM Testimonials`;
    const params: any[] = [];
    const whereClauses: string[] = [];

    if (queryParams?.isApproved === undefined) { // Default: only show approved
        whereClauses.push('is_approved = ?');
        params.push(true);
    } else if (queryParams?.isApproved !== undefined) {
        whereClauses.push('is_approved = ?');
        params.push(queryParams.isApproved);
    }

    if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    sql += ` ORDER BY submitted_at DESC, rating DESC`; // เรียงตามวันที่ส่งล่าสุด และ Rating

    try {
        const [rows] = await pool.query<Testimonial[]>(sql, params);
        return rows;
    } catch (error: any) {
        logger.error({ err: error, queryParams }, 'Error fetching all testimonials');
        throw new ApiError(500, 'Could not retrieve testimonials due to a server error', false);
    }
};

// --- CRUD Functions สำหรับ Admin (ตัวอย่าง) ---
export const createTestimonial = async (pool: Pool, input: CreateTestimonialInput): Promise<Testimonial> => {
    const { coupleName, photoUrl, rating, quote, weddingDate, isApproved } = input;
    logger.debug({ coupleName }, 'Creating new testimonial');
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO Testimonials (couple_name, photo_url, rating, quote, wedding_date, is_approved) VALUES (?, ?, ?, ?, ?, ?)',
            [coupleName, photoUrl, rating, quote, weddingDate ? new Date(weddingDate) : null, isApproved]
        );
        const testimonialId = result.insertId;
        if (!testimonialId) {
            await connection.rollback();
            throw new ApiError(500, 'Failed to create testimonial.', false);
        }
        await connection.commit();
        logger.info({ testimonialId, coupleName }, 'Testimonial created successfully');
        const [rows] = await connection.query<Testimonial[]>('SELECT * FROM Testimonials WHERE testimonial_id = ?', [testimonialId]);
        return rows[0];
    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, input }, 'Error creating testimonial');
        throw new ApiError(500, 'Could not create testimonial due to a server error', false);
    } finally {
        connection.release();
    }
};

export const getTestimonialById = async (pool: Pool, testimonialId: number): Promise<Testimonial | null> => {
    logger.debug({ testimonialId }, 'Fetching testimonial by ID');
    try {
        const [rows] = await pool.query<Testimonial[]>('SELECT * FROM Testimonials WHERE testimonial_id = ?', [testimonialId]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
        logger.error({ err: error, testimonialId }, 'Error fetching testimonial by ID');
        throw new ApiError(500, 'Could not retrieve testimonial details.', false);
    }
};

export const updateTestimonialById = async (pool: Pool, testimonialId: number, input: UpdateTestimonialInput): Promise<Testimonial> => {
    logger.debug({ testimonialId, input }, 'Updating testimonial');
    const fieldsToUpdate: { [key: string]: any } = {};
    const queryParams: any[] = [];
    const fieldMap: { [key in keyof UpdateTestimonialInput]?: string } = {
        coupleName: 'couple_name', photoUrl: 'photo_url', rating: 'rating', quote: 'quote',
        weddingDate: 'wedding_date', isApproved: 'is_approved',
    };

    for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key) && input[key as keyof UpdateTestimonialInput] !== undefined) {
            const dbField = fieldMap[key as keyof UpdateTestimonialInput];
            if (dbField) {
                fieldsToUpdate[dbField] = (dbField === 'weddingDate' && input.weddingDate)
                                            ? new Date(input.weddingDate)
                                            : input[key as keyof UpdateTestimonialInput];
            }
        }
    }
    if (Object.keys(fieldsToUpdate).length === 0) { /* ... handle no fields ... */
        const current = await getTestimonialById(pool, testimonialId);
        if(!current) throw new NotFoundError('Testimonial not found for update (no fields).');
        return current;
    }
    const setClauses = Object.keys(fieldsToUpdate).map(field => `${field} = ?`).join(', ');
    queryParams.push(...Object.values(fieldsToUpdate));
    queryParams.push(testimonialId);
    // Assuming Testimonials table also has created_at, updated_at (add updated_at = NOW() if so)
    const sql = `UPDATE Testimonials SET ${setClauses} WHERE testimonial_id = ?`;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query<ResultSetHeader>(sql, queryParams);
        if (result.affectedRows === 0) {
            await connection.rollback();
            throw new NotFoundError('Testimonial not found for update.');
        }
        await connection.commit();
        logger.info({ testimonialId }, 'Testimonial updated successfully');
        return (await getTestimonialById(pool, testimonialId))!;
    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, testimonialId, input }, 'Error updating testimonial');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not update testimonial.', false);
    } finally {
        connection.release();
    }
};

export const deleteTestimonialById = async (pool: Pool, testimonialId: number): Promise<{ success: boolean, message: string }> => {
    logger.debug({ testimonialId }, 'Deleting testimonial');
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query<ResultSetHeader>('DELETE FROM Testimonials WHERE testimonial_id = ?', [testimonialId]);
        if (result.affectedRows === 0) {
            await connection.rollback();
            throw new NotFoundError('Testimonial not found for deletion.');
        }
        await connection.commit();
        logger.info({ testimonialId }, 'Testimonial deleted successfully');
        return { success: true, message: 'Testimonial deleted successfully.' };
    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, testimonialId }, 'Error deleting testimonial');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not delete testimonial.', false);
    } finally {
        connection.release();
    }
};