// src/services/event.service.ts
import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import logger from '../utils/logger';
import ApiError from '../errors/apiError';
import NotFoundError from '../errors/notFoundError';
import { GetAllEventsQuery, CreateEventInput, UpdateEventInput } from '../schemas/event.schema';

export interface Event extends RowDataPacket {
    event_id: number;
    name: string;
    event_datetime: Date;
    location_name: string;
    location_address: string | null;
    description: string | null;
    is_active: boolean;
    // created_at, updated_at ถ้ามี
}

/**
 * ดึงรายการ Events ทั้งหมด (ปกติจะดึงเฉพาะ Active และที่ยังไม่ถึงวันจัด)
 */
export const getAllEvents = async (pool: Pool, queryParams?: GetAllEventsQuery): Promise<Event[]> => {
    logger.debug({ queryParams }, 'Fetching all events');
    let sql = `SELECT event_id, name, event_datetime, location_name, location_address, description, is_active FROM Events`;
    const params: any[] = [];
    const whereClauses: string[] = [];

    // Default: only show active and upcoming/ongoing events
    if (queryParams?.isActive === undefined) {
        whereClauses.push('is_active = ?');
        params.push(true);
        whereClauses.push('event_datetime >= CURDATE()'); // ดึงเฉพาะงานที่ยังไม่ถึงหรือวันนี้
    } else if (queryParams?.isActive !== undefined) {
        whereClauses.push('is_active = ?');
        params.push(queryParams.isActive);
         if (queryParams.isActive === true) { // ถ้าขอ active ก็ filter วันที่ด้วย
            whereClauses.push('event_datetime >= CURDATE()');
        }
    }

    if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    sql += ` ORDER BY event_datetime ASC`; // เรียงตามวันที่จัดงาน

    try {
        const [rows] = await pool.query<Event[]>(sql, params);
        return rows;
    } catch (error: any) {
        logger.error({ err: error, queryParams }, 'Error fetching all events');
        throw new ApiError(500, 'Could not retrieve events due to a server error', false);
    }
};

// --- CRUD Functions สำหรับ Admin (ตัวอย่าง) ---
export const createEvent = async (pool: Pool, input: CreateEventInput): Promise<Event> => {
    const { name, eventDatetime, locationName, locationAddress, description, isActive } = input;
    logger.debug({ name }, 'Creating new event');
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO Events (name, event_datetime, location_name, location_address, description, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [name, new Date(eventDatetime), locationName, locationAddress, description, isActive]
        );
        const eventId = result.insertId;
        if (!eventId) { /* ... handle error ... */ await connection.rollback(); throw new ApiError(500, 'Failed to create event.', false); }
        await connection.commit();
        logger.info({ eventId, name }, 'Event created successfully');
        const [rows] = await connection.query<Event[]>('SELECT * FROM Events WHERE event_id = ?', [eventId]);
        return rows[0];
    } catch (error: any) { /* ... handle error ... */ await connection.rollback(); logger.error({ err: error, input }, 'Error creating event'); throw new ApiError(500, 'Could not create event.', false); }
    finally { connection.release(); }
};

export const getEventById = async (pool: Pool, eventId: number): Promise<Event | null> => {
    // ... (คล้าย getTestimonialById) ...
    logger.debug({ eventId }, 'Fetching event by ID');
    try {
        const [rows] = await pool.query<Event[]>('SELECT * FROM Events WHERE event_id = ?', [eventId]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) { /* ... */ throw new ApiError(500, 'Could not retrieve event details.', false); }
};

export const updateEventById = async (pool: Pool, eventId: number, input: UpdateEventInput): Promise<Event> => {
    // ... (คล้าย updateTestimonialById) ...
    logger.debug({ eventId, input }, 'Updating event');
    const fieldsToUpdate: { [key: string]: any } = {}; /* ... */
    const queryParams: any[] = []; /* ... */
    const fieldMap: { [key in keyof UpdateEventInput]?: string } = { /* ... */
        name: 'name', eventDatetime: 'event_datetime', locationName: 'location_name',
        locationAddress: 'location_address', description: 'description', isActive: 'is_active'
    };
     for (const key in input) { /* ... */
        if (Object.prototype.hasOwnProperty.call(input, key) && input[key as keyof UpdateEventInput] !== undefined) {
            const dbField = fieldMap[key as keyof UpdateEventInput];
            if (dbField) {
                fieldsToUpdate[dbField] = (dbField === 'eventDatetime' && input.eventDatetime)
                                            ? new Date(input.eventDatetime)
                                            : input[key as keyof UpdateEventInput];
            }
        }
    }
    if (Object.keys(fieldsToUpdate).length === 0) { /* ... */
        const current = await getEventById(pool, eventId);
        if(!current) throw new NotFoundError('Event not found for update (no fields).');
        return current;
    }
    const setClauses = Object.keys(fieldsToUpdate).map(field => `${field} = ?`).join(', '); /* ... */
    queryParams.push(...Object.values(fieldsToUpdate));
    queryParams.push(eventId);
    const sql = `UPDATE Events SET ${setClauses} WHERE event_id = ?`; // Add updated_at if table has it
    const connection = await pool.getConnection();
    try { /* ... beginTransaction, query, commit ... */
        await connection.beginTransaction();
        const [result] = await connection.query<ResultSetHeader>(sql, queryParams);
        if (result.affectedRows === 0) { await connection.rollback(); throw new NotFoundError('Event not found for update.');}
        await connection.commit();
        logger.info({ eventId }, 'Event updated successfully');
        return (await getEventById(pool, eventId))!;
    } catch (error) { /* ... rollback, log, throw ... */
        await connection.rollback(); logger.error({ err: error, eventId, input }, 'Error updating event');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not update event.', false);
    } finally { connection.release(); }
};

export const deleteEventById = async (pool: Pool, eventId: number): Promise<{ success: boolean, message: string }> => {
    // ... (คล้าย deleteTestimonialById) ...
    logger.debug({ eventId }, 'Deleting event');
    const connection = await pool.getConnection();
    try { /* ... beginTransaction, query, commit ... */
        await connection.beginTransaction();
        const [result] = await connection.query<ResultSetHeader>('DELETE FROM Events WHERE event_id = ?', [eventId]);
        if (result.affectedRows === 0) { await connection.rollback(); throw new NotFoundError('Event not found for deletion.'); }
        await connection.commit();
        logger.info({ eventId }, 'Event deleted successfully');
        return { success: true, message: 'Event deleted successfully.' };
    } catch (error) { /* ... rollback, log, throw ... */
        await connection.rollback(); logger.error({ err: error, eventId }, 'Error deleting event');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not delete event.', false);
    } finally { connection.release(); }
};