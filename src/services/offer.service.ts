// src/services/offer.service.ts
import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import logger from '../utils/logger';
import ApiError from '../errors/apiError';
import NotFoundError from '../errors/notFoundError';
import { GetAllOffersQuery, CreateOfferInput, UpdateOfferInput } from '../schemas/offer.schema';

export interface Offer extends RowDataPacket {
    offer_id: number;
    title: string;
    description: string | null;
    icon_url: string | null;
    discount_details: string | null;
    valid_from: Date | null;
    valid_until: Date | null;
    is_active: boolean;
    // created_at, updated_at ถ้ามีในตาราง
}

/**
 * ดึงรายการ Special Offers ทั้งหมด
 */
export const getAllOffers = async (pool: Pool, queryParams?: GetAllOffersQuery): Promise<Offer[]> => {
    logger.debug({ queryParams }, 'Fetching all special offers');
    let sql = `SELECT offer_id, title, description, icon_url, discount_details, valid_from, valid_until, is_active FROM SpecialOffers`;
    const params: any[] = [];
    const whereClauses: string[] = [];

    // By default, only fetch active offers unless 'isActive=false' is specified
    // And offers that are currently valid (valid_until >= NOW() OR valid_until IS NULL)
    const defaultWhere: string[] = [];
    if (queryParams?.isActive === undefined) {
        defaultWhere.push('is_active = ?');
        params.push(true);
        defaultWhere.push('(valid_until IS NULL OR valid_until >= CURDATE())'); // ดึงเฉพาะที่ยังไม่หมดอายุ หรือไม่มีวันหมดอายุ
    } else if (queryParams?.isActive !== undefined) {
        whereClauses.push('is_active = ?');
        params.push(queryParams.isActive);
        // ถ้า isActive=true, ก็ควรจะ filter valid_until ด้วย
        if (queryParams.isActive === true) {
             whereClauses.push('(valid_until IS NULL OR valid_until >= CURDATE())');
        }
    }
     // ถ้า queryParams.isActive ไม่ได้ถูกส่งมา แต่เรายังอยาก filter default
     if (queryParams?.isActive === undefined && defaultWhere.length > 0){
        whereClauses.push(...defaultWhere);
     }


    if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    // เรียงตามวันหมดอายุที่ใกล้ที่สุดก่อน หรือตาม ID
    sql += ` ORDER BY valid_until ASC, offer_id DESC`;

    try {
        const [rows] = await pool.query<Offer[]>(sql, params);
        return rows;
    } catch (error: any) {
        logger.error({ err: error, queryParams }, 'Error fetching all special offers');
        throw new ApiError(500, 'Could not retrieve special offers due to a server error', false);
    }
};

// --- CRUD Functions สำหรับ Admin (ตัวอย่าง) ---
export const createOffer = async (pool: Pool, input: CreateOfferInput): Promise<Offer> => {
    const { title, description, iconUrl, discountDetails, validFrom, validUntil, isActive } = input;
    logger.debug({ title }, 'Creating new special offer');
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO SpecialOffers (title, description, icon_url, discount_details, valid_from, valid_until, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, description, iconUrl, discountDetails, validFrom ? new Date(validFrom) : null, validUntil ? new Date(validUntil) : null, isActive]
        );
        const offerId = result.insertId;
        if (!offerId) {
            await connection.rollback();
            throw new ApiError(500, 'Failed to create special offer.', false);
        }
        await connection.commit();
        logger.info({ offerId, title }, 'Special offer created successfully');
        // ดึง Offer ที่เพิ่งสร้างกลับมา
        const [offerRows] = await connection.query<Offer[]>('SELECT * FROM SpecialOffers WHERE offer_id = ?', [offerId]);
        return offerRows[0];
    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, input }, 'Error creating special offer');
        throw new ApiError(500, 'Could not create special offer due to a server error', false);
    } finally {
        connection.release();
    }
};

export const getOfferById = async (pool: Pool, offerId: number): Promise<Offer | null> => {
     logger.debug({ offerId }, 'Fetching offer by ID');
    try {
        const [rows] = await pool.query<Offer[]>(
            'SELECT * FROM SpecialOffers WHERE offer_id = ? LIMIT 1',
            [offerId]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
        logger.error({ err: error, offerId }, 'Error fetching offer by ID');
        throw new ApiError(500, 'Could not retrieve offer details due to a server error', false);
    }
};

export const updateOfferById = async (pool: Pool, offerId: number, input: UpdateOfferInput): Promise<Offer> => {
    logger.debug({ offerId, input }, 'Updating special offer');
    const fieldsToUpdate: { [key: string]: any } = {};
    const queryParams: any[] = [];
    const fieldMap: { [key in keyof UpdateOfferInput]?: string } = {
        title: 'title', description: 'description', iconUrl: 'icon_url', discountDetails: 'discount_details',
        validFrom: 'valid_from', validUntil: 'valid_until', isActive: 'is_active',
    };

    for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key) && input[key as keyof UpdateOfferInput] !== undefined) {
            const dbField = fieldMap[key as keyof UpdateOfferInput];
            if (dbField) {
                fieldsToUpdate[dbField] = (dbField === 'validFrom' && input.validFrom) ? new Date(input.validFrom)
                                         : (dbField === 'validUntil' && input.validUntil) ? new Date(input.validUntil)
                                         : input[key as keyof UpdateOfferInput];
            }
        }
    }
    if (Object.keys(fieldsToUpdate).length === 0) {
        logger.warn({ offerId }, 'No valid fields provided for offer update.');
        const currentOffer = await getOfferById(pool, offerId);
        if(!currentOffer) throw new NotFoundError('Offer not found for update (no fields).');
        return currentOffer;
    }

    const setClauses = Object.keys(fieldsToUpdate).map(field => `${field} = ?`).join(', ');
    queryParams.push(...Object.values(fieldsToUpdate));
    queryParams.push(offerId);
    // Assuming SpecialOffers table also has created_at, updated_at
    const sql = `UPDATE SpecialOffers SET ${setClauses} WHERE offer_id = ?`; // Add updated_at = NOW() if table has it

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query<ResultSetHeader>(sql, queryParams);
        if (result.affectedRows === 0) {
            await connection.rollback();
            throw new NotFoundError('Special offer not found for update.');
        }
        await connection.commit();
        logger.info({ offerId }, 'Special offer updated successfully');
        return (await getOfferById(pool, offerId))!;
    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, offerId, input }, 'Error updating special offer');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not update special offer due to a server error', false);
    } finally {
        connection.release();
    }
};

export const deleteOfferById = async (pool: Pool, offerId: number): Promise<{ success: boolean, message: string }> => {
    logger.debug({ offerId }, 'Deleting special offer');
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query<ResultSetHeader>(
            'DELETE FROM SpecialOffers WHERE offer_id = ?',
            [offerId]
        );
        if (result.affectedRows === 0) {
            await connection.rollback();
            throw new NotFoundError('Special offer not found for deletion.');
        }
        await connection.commit();
        logger.info({ offerId }, 'Special offer deleted successfully');
        return { success: true, message: 'Special offer deleted successfully.' };
    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, offerId }, 'Error deleting special offer');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not delete special offer due to a server error', false);
    } finally {
        connection.release();
    }
};