// src/services/banner.service.ts
import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import logger from '../utils/logger';
import ApiError from '../errors/apiError';
import NotFoundError from '../errors/notFoundError';
import { GetAllBannersQuery, CreateBannerInput, UpdateBannerInput } from '../schemas/banner.schema';

export interface Banner extends RowDataPacket {
    banner_id: number;
    image_url: string;
    title: string | null;
    subtitle: string | null;
    button_text: string | null;
    button_link: string | null;
    sort_order: number;
    is_active: boolean;
    // created_at, updated_at ถ้ามีในตาราง
}

/**
 * ดึงรายการ Banners ทั้งหมด (โดยปกติจะดึงเฉพาะ Active และเรียงตาม sort_order)
 */
export const getAllBanners = async (pool: Pool, queryParams?: GetAllBannersQuery): Promise<Banner[]> => {
    logger.debug({ queryParams }, 'Fetching all banners');
    let sql = `SELECT banner_id, image_url, title, subtitle, button_text, button_link, sort_order, is_active FROM HeroBanners`;
    const params: any[] = [];
    const whereClauses: string[] = [];

    // By default, only fetch active banners unless 'isActive=false' is specified
    if (queryParams?.isActive === undefined) {
        whereClauses.push('is_active = ?');
        params.push(true);
    } else if (queryParams?.isActive !== undefined) {
        whereClauses.push('is_active = ?');
        params.push(queryParams.isActive);
    }

    if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    sql += ` ORDER BY sort_order ASC, banner_id ASC`; // เรียงตาม sort_order ก่อน แล้วตาม ID

    try {
        const [rows] = await pool.query<Banner[]>(sql, params);
        return rows;
    } catch (error: any) {
        logger.error({ err: error, queryParams }, 'Error fetching all banners');
        throw new ApiError(500, 'Could not retrieve banners due to a server error', false);
    }
};

// --- CRUD Functions สำหรับ Admin (ตัวอย่าง) ---
export const createBanner = async (pool: Pool, input: CreateBannerInput): Promise<Banner> => {
    const { imageUrl, title, subtitle, buttonText, buttonLink, sortOrder, isActive } = input;
    logger.debug({ title }, 'Creating new banner');
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO HeroBanners (image_url, title, subtitle, button_text, button_link, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [imageUrl, title, subtitle, buttonText, buttonLink, sortOrder, isActive]
        );
        const bannerId = result.insertId;
        if (!bannerId) {
            await connection.rollback();
            throw new ApiError(500, 'Failed to create banner.', false);
        }
        await connection.commit();
        logger.info({ bannerId, title }, 'Banner created successfully');

        // ดึง Banner ที่เพิ่งสร้างกลับมา
        const [bannerRows] = await connection.query<Banner[]>('SELECT * FROM HeroBanners WHERE banner_id = ?', [bannerId]);
        return bannerRows[0];

    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, input }, 'Error creating banner');
        throw new ApiError(500, 'Could not create banner due to a server error', false);
    } finally {
        connection.release();
    }
};

export const getBannerById = async (pool: Pool, bannerId: number): Promise<Banner | null> => {
    logger.debug({ bannerId }, 'Fetching banner by ID');
    try {
        const [rows] = await pool.query<Banner[]>(
            'SELECT * FROM HeroBanners WHERE banner_id = ? LIMIT 1',
            [bannerId]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
        logger.error({ err: error, bannerId }, 'Error fetching banner by ID');
        throw new ApiError(500, 'Could not retrieve banner details due to a server error', false);
    }
};


export const updateBannerById = async (pool: Pool, bannerId: number, input: UpdateBannerInput): Promise<Banner> => {
    logger.debug({ bannerId, input }, 'Updating banner');
    const fieldsToUpdate: { [key: string]: any } = {};
    const queryParams: any[] = [];
    const fieldMap: { [key in keyof UpdateBannerInput]?: string } = {
        imageUrl: 'image_url', title: 'title', subtitle: 'subtitle', buttonText: 'button_text',
        buttonLink: 'button_link', sortOrder: 'sort_order', isActive: 'is_active',
    };

    for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key) && input[key as keyof UpdateBannerInput] !== undefined) {
            const dbField = fieldMap[key as keyof UpdateBannerInput];
            if (dbField) {
                fieldsToUpdate[dbField] = input[key as keyof UpdateBannerInput];
            }
        }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
        logger.warn({ bannerId }, 'No valid fields provided for banner update.');
        const currentBanner = await getBannerById(pool, bannerId); // Re-fetch or throw error
        if (!currentBanner) throw new NotFoundError('Banner not found for update (no fields).');
        return currentBanner;
    }

    const setClauses = Object.keys(fieldsToUpdate).map(field => `${field} = ?`).join(', ');
    queryParams.push(...Object.values(fieldsToUpdate));
    queryParams.push(bannerId);
    const sql = `UPDATE HeroBanners SET ${setClauses} WHERE banner_id = ?`; // Assuming no updated_at in HeroBanners table explicitly in this example

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query<ResultSetHeader>(sql, queryParams);
        if (result.affectedRows === 0) {
            await connection.rollback();
            throw new NotFoundError('Banner not found for update.');
        }
        await connection.commit();
        logger.info({ bannerId }, 'Banner updated successfully');
        return (await getBannerById(pool, bannerId))!;
    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, bannerId, input }, 'Error updating banner');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not update banner due to a server error', false);
    } finally {
        connection.release();
    }
};

export const deleteBannerById = async (pool: Pool, bannerId: number): Promise<{ success: boolean, message: string }> => {
    logger.debug({ bannerId }, 'Deleting banner');
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query<ResultSetHeader>(
            'DELETE FROM HeroBanners WHERE banner_id = ?',
            [bannerId]
        );
        if (result.affectedRows === 0) {
            await connection.rollback();
            throw new NotFoundError('Banner not found for deletion.');
        }
        await connection.commit();
        logger.info({ bannerId }, 'Banner deleted successfully');
        return { success: true, message: 'Banner deleted successfully.' };
    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, bannerId }, 'Error deleting banner');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not delete banner due to a server error', false);
    } finally {
        connection.release();
    }
};