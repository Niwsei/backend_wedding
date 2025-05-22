// src/services/gallery.service.ts
import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import logger from '../utils/logger';
import ApiError from '../errors/apiError';
import NotFoundError from '../errors/notFoundError';
import { GetAllGalleryItemsQuery, CreateGalleryItemInput, UpdateGalleryItemInput } from '../schemas/gallery.schema';

export interface GalleryItem extends RowDataPacket {
    item_id: number;
    image_url: string;
    video_url: string | null;
    title: string | null;
    description: string | null;
    collection_tag: string | null;
    category: string | null;
    event_date: Date | null;
    is_featured: boolean;
    is_active: boolean;
    uploaded_at: Date;
    // อาจจะมี user_id ถ้าต้องการ Track ว่าใคร Upload (ถ้ามีระบบ User Upload)
    // อาจจะมี is_liked_by_current_user: boolean (ถ้า Join กับ UserSavedInspirations)
}

/**
 * ดึงรายการ Gallery Items ทั้งหมด
 */
export const getAllGalleryItems = async (pool: Pool, queryParams?: GetAllGalleryItemsQuery): Promise<GalleryItem[]> => {
    logger.debug({ queryParams }, 'Fetching all gallery items');
    let sql = `SELECT item_id, image_url, video_url, title, description, collection_tag, category, event_date, is_featured, is_active, uploaded_at FROM GalleryItems`;
    const params: any[] = [];
    const whereClauses: string[] = [];

    // Default to only active items unless specified
    if (queryParams?.isActive === undefined) {
        whereClauses.push('is_active = ?');
        params.push(true);
    } else if (queryParams?.isActive !== undefined) {
        whereClauses.push('is_active = ?');
        params.push(queryParams.isActive);
    }

    if (queryParams?.category) {
        whereClauses.push('category = ?');
        params.push(queryParams.category);
    }
    if (queryParams?.isFeatured !== undefined) {
        whereClauses.push('is_featured = ?');
        params.push(queryParams.isFeatured);
    }

    if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    sql += ` ORDER BY uploaded_at DESC`; // Default sort by newest

    // TODO: Implement pagination

    try {
        const [rows] = await pool.query<GalleryItem[]>(sql, params);
        return rows;
    } catch (error: any) {
        logger.error({ err: error, queryParams }, 'Error fetching all gallery items');
        throw new ApiError(500, 'Could not retrieve gallery items due to a server error', false);
    }
};

/**
 * ดึงข้อมูล Gallery Item เฉพาะตัวตาม ID
 */
export const getGalleryItemById = async (pool: Pool, itemId: number): Promise<GalleryItem | null> => {
    logger.debug({ itemId }, 'Fetching gallery item by ID');
    try {
        const [rows] = await pool.query<GalleryItem[]>(
            'SELECT * FROM GalleryItems WHERE item_id = ? AND is_active = TRUE LIMIT 1', // ดึงเฉพาะที่ Active
            [itemId]
        );
        return rows.length > 0 ? rows[0] : null; // หรือ throw new NotFoundError
    } catch (error: any) {
        logger.error({ err: error, itemId }, 'Error fetching gallery item by ID');
        throw new ApiError(500, 'Could not retrieve gallery item details due to a server error', false);
    }
};

// --- CRUD Functions สำหรับ Admin (ตัวอย่าง) ---
export const createGalleryItem = async (pool: Pool, input: CreateGalleryItemInput): Promise<GalleryItem> => {
    const { imageUrl, videoUrl, title, description, collectionTag, category, eventDate, isFeatured, isActive } = input;
    logger.debug({ title }, 'Creating new gallery item');
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO GalleryItems (image_url, video_url, title, description, collection_tag, category, event_date, is_featured, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [imageUrl, videoUrl, title, description, collectionTag, category, eventDate ? new Date(eventDate) : null, isFeatured, isActive]
        );
        const insertId = result.insertId;
        if(!insertId) {
            await connection.rollback();
            throw new ApiError(500, 'Failed to create gallery item.', false);
        }
        await connection.commit();
        logger.info({ itemId: insertId, title }, 'Gallery item created successfully');
        return (await getGalleryItemById(pool, insertId))!;
    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, input }, 'Error creating gallery item');
        throw new ApiError(500, 'Could not create gallery item due to a server error', false);
    } finally {
        connection.release();
    }
};

export const updateGalleryItemById = async (pool: Pool, itemId: number, input: UpdateGalleryItemInput): Promise<GalleryItem> => {
    logger.debug({ itemId, input }, 'Updating gallery item');
    const fieldsToUpdate: { [key: string]: any } = {};
    const queryParams: any[] = [];
    const fieldMap: { [key in keyof UpdateGalleryItemInput]?: string } = {
        imageUrl: 'image_url', videoUrl: 'video_url', title: 'title', description: 'description',
        collectionTag: 'collection_tag', category: 'category', eventDate: 'event_date',
        isFeatured: 'is_featured', isActive: 'is_active',
    };

    for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key) && input[key as keyof UpdateGalleryItemInput] !== undefined) {
            const dbField = fieldMap[key as keyof UpdateGalleryItemInput];
            if (dbField) {
                fieldsToUpdate[dbField] = (dbField === 'event_date' && input.eventDate)
                                            ? new Date(input.eventDate)
                                            : input[key as keyof UpdateGalleryItemInput];
            }
        }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
        logger.warn({ itemId }, 'No valid fields provided for gallery item update.');
        const currentItem = await getGalleryItemById(pool, itemId);
        if (!currentItem) throw new NotFoundError('Gallery item not found for update (no fields).');
        return currentItem;
    }

    const setClauses = Object.keys(fieldsToUpdate).map(field => `${field} = ?`).join(', ');
    queryParams.push(...Object.values(fieldsToUpdate));
    queryParams.push(itemId);
    const sql = `UPDATE GalleryItems SET ${setClauses}, uploaded_at = NOW() WHERE item_id = ?`; // uploaded_at อาจจะเปลี่ยนเป็น updated_at ถ้ามีคอลัมน์นั้น

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query<ResultSetHeader>(sql, queryParams);
        if (result.affectedRows === 0) {
            await connection.rollback();
            throw new NotFoundError('Gallery item not found for update.');
        }
        await connection.commit();
        logger.info({ itemId }, 'Gallery item updated successfully');
        return (await getGalleryItemById(pool, itemId))!;
    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, itemId, input }, 'Error updating gallery item');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not update gallery item due to a server error', false);
    } finally {
        connection.release();
    }
};

export const deleteGalleryItemById = async (pool: Pool, itemId: number): Promise<{ success: boolean, message: string }> => {
    logger.debug({ itemId }, 'Deleting gallery item');
    // การลบ Gallery Item อาจจะต้องลบออกจาก UserSavedInspirations ด้วย (ON DELETE CASCADE ช่วยได้)
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query<ResultSetHeader>(
            'DELETE FROM GalleryItems WHERE item_id = ?',
            [itemId]
        );
        if (result.affectedRows === 0) {
            await connection.rollback();
            throw new NotFoundError('Gallery item not found for deletion.');
        }
        await connection.commit();
        logger.info({ itemId }, 'Gallery item deleted successfully');
        return { success: true, message: 'Gallery item deleted successfully.' };
    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, itemId }, 'Error deleting gallery item');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not delete gallery item due to a server error', false);
    } finally {
        connection.release();
    }
};