// src/services/service.service.ts
import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import logger from '../utils/logger';
import ApiError from '../errors/apiError';
import NotFoundError from '../errors/notFoundError';
import { GetAllServicesQuery, CreateServiceInput, UpdateServiceInput } from '../schemas/service.schema';

export interface ServiceWithFeatures extends RowDataPacket {
    service_id: number;
    name: string;
    description: string | null;
    category: string | null;
    base_price: number | null; // DECIMAL ใน DB จะมาเป็น string หรือ number ขึ้นกับ Driver/Setting
    cover_image_url: string | null;
    icon_url: string | null;
    is_active: boolean; // หรือ TINYINT(1)
    features?: string[]; // Array of feature names (ถ้า JOIN มา)
}

/**
 * ดึงรายการ Services ทั้งหมด พร้อม Filter (เบื้องต้น)
 */
export const getAllServices = async (pool: Pool, queryParams?: GetAllServicesQuery): Promise<ServiceWithFeatures[]> => {
    logger.debug({ queryParams }, 'Fetching all services');
    let sql = `SELECT service_id, name, description, category, base_price, cover_image_url, icon_url, is_active FROM Services`;
    const params: any[] = [];
    const whereClauses: string[] = [];

    if (queryParams?.category) {
        whereClauses.push('category = ?');
        params.push(queryParams.category);
    }
    if (queryParams?.isActive !== undefined) { // ตรวจสอบ undefined เพราะ boolean false ก็เป็นค่าที่ถูกต้อง
        whereClauses.push('is_active = ?');
        params.push(queryParams.isActive);
    }
    // else {
    // By default, only fetch active services unless 'isActive=false' is specified
    // OR if you want to fetch all by default if isActive is not specified
    // For now, let's fetch based on the query, or all if no isActive filter
    // }


    if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    sql += ` ORDER BY name ASC`; // Default sort

    // TODO: Implement pagination (LIMIT, OFFSET) and more advanced sorting

    try {
        const [rows] = await pool.query<ServiceWithFeatures[]>(sql, params);
        // TODO: ถ้าต้องการรวม features, อาจจะต้อง Query ServiceFeatures แยก หรือใช้ JOIN ที่ซับซ้อนขึ้น
        return rows;
    } catch (error: any) {
        logger.error({ err: error, queryParams }, 'Error fetching all services');
        throw new ApiError(500, 'Could not retrieve services due to a server error', false);
    }
};

/**
 * ดึงข้อมูล Service เฉพาะตัวตาม ID พร้อม Features
 */
export const getServiceById = async (pool: Pool, serviceId: number): Promise<ServiceWithFeatures | null> => {
    logger.debug({ serviceId }, 'Fetching service by ID');
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [serviceRows] = await connection.query<ServiceWithFeatures[]>(
            'SELECT * FROM Services WHERE service_id = ? LIMIT 1',
            [serviceId]
        );
        const service = serviceRows[0];

        if (!service) {
            await connection.rollback(); // ไม่จำเป็นถ้า query แรกไม่เจอ แต่ใส่ไว้กันเหนียว
            return null; // หรือ throw new NotFoundError('Service not found');
        }

        // ดึง Features (ถ้ามีตาราง ServiceFeatures)
        const [featureRows] = await connection.query<RowDataPacket[]>(
            'SELECT feature_name FROM ServiceFeatures WHERE service_id = ?',
            [serviceId]
        );
        service.features = featureRows.map(row => row.feature_name);

        await connection.commit(); // ไม่ได้แก้ไขอะไร แต่เป็น pattern ที่ดีถ้ามีหลาย query
        return service;

    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, serviceId }, 'Error fetching service by ID');
        throw new ApiError(500, 'Could not retrieve service details due to a server error', false);
    } finally {
        connection.release();
    }
};


// --- CRUD Functions สำหรับ Admin (ตัวอย่าง) ---

export const createService = async (pool: Pool, input: CreateServiceInput): Promise<ServiceWithFeatures> => {
    const { name, description, category, basePrice, coverImageUrl, iconUrl, isActive, features } = input;
    logger.debug({ name }, 'Creating new service');

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insert vào Services table
        const [serviceResult] = await connection.query<ResultSetHeader>(
            'INSERT INTO Services (name, description, category, base_price, cover_image_url, icon_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description, category, basePrice, coverImageUrl, iconUrl, isActive]
        );
        const serviceId = serviceResult.insertId;
        if (!serviceId) {
            await connection.rollback();
            throw new ApiError(500, 'Failed to create service (no insertId).', false);
        }

        // 2. Insert features into ServiceFeatures table (if provided)
        if (features && features.length > 0) {
            const featureValues = features.map(featureName => [serviceId, featureName]);
            await connection.query(
                'INSERT INTO ServiceFeatures (service_id, feature_name) VALUES ?',
                [featureValues] // mysql2 รองรับการ Insert หลายแถวแบบนี้
            );
        }

        await connection.commit();
        logger.info({ serviceId, name }, 'Service created successfully');

        // ดึง Service ที่เพิ่งสร้างพร้อม Features กลับไป
        return (await getServiceById(pool, serviceId))!; // ใช้ ! เพราะมั่นใจว่าสร้างแล้ว

    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, input }, 'Error creating service');
         if (error.code === 'ER_DUP_ENTRY') { // ตัวอย่างการจัดการ Error เฉพาะ
             throw new ApiError(409, 'Service with this name or identifier already exists.', true);
         }
        throw new ApiError(500, 'Could not create service due to a server error', false);
    } finally {
        connection.release();
    }
};

export const updateServiceById = async (pool: Pool, serviceId: number, input: UpdateServiceInput): Promise<ServiceWithFeatures> => {
    logger.debug({ serviceId, input }, 'Updating service');
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. อัปเดตตาราง Services
        const serviceFieldsToUpdate: { [key: string]: any } = {};
        const serviceQueryParams: any[] = [];
        const serviceFieldMap: { [key in keyof UpdateServiceInput]?: string } = {
            name: 'name', description: 'description', category: 'category',
            basePrice: 'base_price', coverImageUrl: 'cover_image_url',
            iconUrl: 'icon_url', isActive: 'is_active',
        };

        for (const key in input) {
            if (key === 'features') continue; // จัดการ features แยก
            if (Object.prototype.hasOwnProperty.call(input, key) && input[key as keyof UpdateServiceInput] !== undefined) {
                const dbField = serviceFieldMap[key as keyof UpdateServiceInput];
                if (dbField) {
                    serviceFieldsToUpdate[dbField] = input[key as keyof UpdateServiceInput];
                }
            }
        }

        if (Object.keys(serviceFieldsToUpdate).length > 0) {
            const setClauses = Object.keys(serviceFieldsToUpdate).map(field => `${field} = ?`).join(', ');
            serviceQueryParams.push(...Object.values(serviceFieldsToUpdate));
            serviceQueryParams.push(serviceId);
            const updateSql = `UPDATE Services SET ${setClauses}, updated_at = NOW() WHERE service_id = ?`;
            const [updateResult] = await connection.query<ResultSetHeader>(updateSql, serviceQueryParams);
            if (updateResult.affectedRows === 0) {
                 await connection.rollback();
                 throw new NotFoundError('Service not found for update.');
            }
        }

        // 2. อัปเดต ServiceFeatures (ลบของเก่าทั้งหมดแล้วเพิ่มใหม่ตาม input)
        if (input.features !== undefined) { // ถ้า features ถูกส่งมา (แม้จะเป็น array ว่าง)
            // ลบ features เก่าทั้งหมดของ service นี้
            await connection.query('DELETE FROM ServiceFeatures WHERE service_id = ?', [serviceId]);

            // เพิ่ม features ใหม่ถ้ามี
            if (input.features && input.features.length > 0) {
                const featureValues = input.features.map(featureName => [serviceId, featureName]);
                await connection.query(
                    'INSERT INTO ServiceFeatures (service_id, feature_name) VALUES ?',
                    [featureValues]
                );
            }
        }

        await connection.commit();
        logger.info({ serviceId }, 'Service updated successfully');
        return (await getServiceById(pool, serviceId))!;

    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, serviceId, input }, 'Error updating service');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not update service due to a server error', false);
    } finally {
        connection.release();
    }
};

export const deleteServiceById = async (pool: Pool, serviceId: number): Promise<{ success: boolean, message: string }> => {
    logger.debug({ serviceId }, 'Deleting service');
    // การลบ Service อาจจะต้องพิจารณาเรื่อง Foreign Key Constraints (ON DELETE CASCADE ใน ServiceFeatures ช่วยได้)
    // แต่ถ้ามี Bookings หรือ Packages อ้างอิงอยู่ อาจจะต้องป้องกันการลบ หรือตั้งเป็น Inactive แทน
    // ในตัวอย่างนี้จะลบจริง และอาศัย ON DELETE CASCADE

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // ServiceFeatures จะถูกลบอัตโนมัติถ้าตั้ง ON DELETE CASCADE

        // ตรวจสอบว่ามี Packages หรือ Bookings อ้างอิงอยู่หรือไม่ (ควรทำ)
        // const [packageRefs] = await connection.query('SELECT package_id FROM PackageServices WHERE service_id = ? LIMIT 1', [serviceId]);
        // if (packageRefs.length > 0) throw new ApiError(400, 'Cannot delete service: It is part of one or more packages.');
        // const [bookingRefs] = await connection.query('SELECT booking_id FROM Bookings WHERE service_id = ? LIMIT 1', [serviceId]);
        // if (bookingRefs.length > 0) throw new ApiError(400, 'Cannot delete service: It has existing bookings.');


        const [result] = await connection.query<ResultSetHeader>(
            'DELETE FROM Services WHERE service_id = ?',
            [serviceId]
        );
        if (result.affectedRows === 0) {
            await connection.rollback();
            throw new NotFoundError('Service not found for deletion.');
        }
        await connection.commit();
        logger.info({ serviceId }, 'Service deleted successfully');
        return { success: true, message: 'Service deleted successfully.' };
    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, serviceId }, 'Error deleting service');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not delete service due to a server error', false);
    } finally {
        connection.release();
    }
};