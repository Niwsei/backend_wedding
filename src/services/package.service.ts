// src/services/package.service.ts
import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import logger from '../utils/logger';
import ApiError from '../errors/apiError';
import NotFoundError from '../errors/notFoundError';
import { GetAllPackagesQuery, CreatePackageInput, UpdatePackageInput } from '../schemas/package.schema';
import { ServiceWithFeatures } from './service.service'; // อาจจะ Import Interface จาก service.service

export interface PackageBase extends RowDataPacket {
    package_id: number;
    name: string;
    description: string | null;
    price: number; // DECIMAL ใน DB
    cover_image_url: string | null;
    is_popular: boolean;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface PackageWithServices extends PackageBase {
    services?: Partial<ServiceWithFeatures>[]; // รายการ Services ที่รวมอยู่ (เอาเฉพาะบาง Field ของ Service)
}

/**
 * ดึงรายการ Packages ทั้งหมด
 */
export const getAllPackages = async (pool: Pool, queryParams?: GetAllPackagesQuery): Promise<PackageBase[]> => {
    logger.debug({ queryParams }, 'Fetching all packages');
    let sql = `SELECT package_id, name, description, price, cover_image_url, is_popular, is_active, created_at, updated_at FROM Packages`;
    const params: any[] = [];
    const whereClauses: string[] = [];

    if (queryParams?.isPopular !== undefined) {
        whereClauses.push('is_popular = ?');
        params.push(queryParams.isPopular);
    }
    if (queryParams?.isActive !== undefined) {
        whereClauses.push('is_active = ?');
        params.push(queryParams.isActive);
    }

    if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    sql += ` ORDER BY name ASC`;

    try {
        const [rows] = await pool.query<PackageBase[]>(sql, params);
        // ถ้าต้องการดึง Services ที่รวมในแต่ละ Package ด้วย อาจจะต้อง Loop แล้ว Query เพิ่ม หรือใช้ JOIN ที่ซับซ้อน
        // สำหรับ List View อาจจะยังไม่จำเป็นต้องดึง Services ทั้งหมด
        return rows;
    } catch (error: any) {
        logger.error({ err: error, queryParams }, 'Error fetching all packages');
        throw new ApiError(500, 'Could not retrieve packages due to a server error', false);
    }
};

/**
 * ดึงข้อมูล Package เฉพาะตัวตาม ID พร้อมกับ Services ที่รวมอยู่
 */
export const getPackageById = async (pool: Pool, packageId: number): Promise<PackageWithServices | null> => {
    logger.debug({ packageId }, 'Fetching package by ID');
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [packageRows] = await connection.query<PackageWithServices[]>(
            'SELECT * FROM Packages WHERE package_id = ? LIMIT 1',
            [packageId]
        );
        const pkg = packageRows[0];

        if (!pkg) {
            await connection.rollback();
            return null; // หรือ throw new NotFoundError('Package not found');
        }

        // ดึง Services ที่เกี่ยวข้องจาก PackageServices และ JOIN กับ Services table
        const [includedServiceRows] = await connection.query<RowDataPacket[]>(
            `SELECT s.service_id, s.name, s.category, s.base_price
             FROM PackageServices ps
             JOIN Services s ON ps.service_id = s.service_id
             WHERE ps.package_id = ? AND s.is_active = TRUE`, // เอาเฉพาะ Service ที่ Active
            [packageId]
        );

         pkg.services = includedServiceRows.map(row => ({
            service_id: row.service_id,
            name: row.name,
            category: row.category,
            base_price: row.base_price
            // เพิ่ม field อื่นๆ ของ Service ที่ต้องการแสดง
        })) as Partial<ServiceWithFeatures>[];

        await connection.commit();
        return pkg;

    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, packageId }, 'Error fetching package by ID');
        throw new ApiError(500, 'Could not retrieve package details due to a server error', false);
    } finally {
        connection.release();
    }
};


// --- CRUD Functions สำหรับ Admin (ตัวอย่าง) ---
export const createPackage = async (pool: Pool, input: CreatePackageInput): Promise<PackageWithServices> => {
    const { name, description, price, coverImageUrl, isPopular, isActive, includedServices } = input;
    logger.debug({ name }, 'Creating new package');
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insert package details
        const [packageResult] = await connection.query<ResultSetHeader>(
            'INSERT INTO Packages (name, description, price, cover_image_url, is_popular, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, price, coverImageUrl, isPopular, isActive]
        );
        const packageId = packageResult.insertId;
        if (!packageId) {
            await connection.rollback();
            throw new ApiError(500, 'Failed to create package (no insertId).', false);
        }

        // 2. Insert included services into PackageServices
        if (includedServices && includedServices.length > 0) {
            // ตรวจสอบว่า Service IDs ที่ส่งมามีอยู่จริง (Optional แต่ดี)
            // const existingServiceIds = (await connection.query<RowDataPacket[]>('SELECT service_id FROM Services WHERE service_id IN (?)', [includedServices])).map(r => r.service_id);
            // const validServices = includedServices.filter(id => existingServiceIds.includes(id));

            const packageServiceValues = includedServices.map(serviceId => [packageId, serviceId]);
            if (packageServiceValues.length > 0) {
                 await connection.query(
                    'INSERT INTO PackageServices (package_id, service_id) VALUES ?',
                    [packageServiceValues]
                );
            }
        }

        await connection.commit();
        logger.info({ packageId, name }, 'Package created successfully');
        return (await getPackageById(pool, packageId))!; // ดึง Package ที่สร้างพร้อม Services

    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, input }, 'Error creating package');
        if (error.code === 'ER_DUP_ENTRY') {
            throw new ApiError(409, 'Package with this name or identifier already exists.', true);
        }
        throw new ApiError(500, 'Could not create package due to a server error', false);
    } finally {
        connection.release();
    }
};

export const updatePackageById = async (pool: Pool, packageId: number, input: UpdatePackageInput): Promise<PackageWithServices> => {
    logger.debug({ packageId, input }, 'Updating package');
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. อัปเดตตาราง Packages
        const packageFieldsToUpdate: { [key: string]: any } = {};
        const packageQueryParams: any[] = [];
        // ไม่รวม includedServices ใน map นี้ เพราะจัดการแยก
        const packageFieldMap: { [key in Exclude<keyof UpdatePackageInput, 'includedServices'>]?: string } = {
             name: 'name', description: 'description', price: 'price',
             coverImageUrl: 'cover_image_url', isPopular: 'is_popular', isActive: 'is_active',
        };

        for (const key in input) {
            if (key === 'includedServices') continue;
            if (Object.prototype.hasOwnProperty.call(input, key) && input[key as keyof UpdatePackageInput] !== undefined) {
                const dbField = packageFieldMap[key as Exclude<keyof UpdatePackageInput, 'includedServices'>];
                if (dbField) {
                    packageFieldsToUpdate[dbField] = input[key as keyof UpdatePackageInput];
                }
            }
        }

        if (Object.keys(packageFieldsToUpdate).length > 0) {
            const setClauses = Object.keys(packageFieldsToUpdate).map(field => `${field} = ?`).join(', ');
            packageQueryParams.push(...Object.values(packageFieldsToUpdate));
            packageQueryParams.push(packageId);
            const updateSql = `UPDATE Packages SET ${setClauses}, updated_at = NOW() WHERE package_id = ?`;
            const [updateResult] = await connection.query<ResultSetHeader>(updateSql, packageQueryParams);
             if (updateResult.affectedRows === 0) {
                 await connection.rollback();
                 throw new NotFoundError('Package not found for update.');
            }
        }

        // 2. อัปเดต PackageServices (ลบของเก่าทั้งหมดของ Package นี้ แล้วเพิ่มใหม่ตาม input)
        if (input.includedServices !== undefined) { // ถ้า includedServices ถูกส่งมา (แม้จะเป็น array ว่าง)
            await connection.query('DELETE FROM PackageServices WHERE package_id = ?', [packageId]);

            if (input.includedServices && input.includedServices.length > 0) {
                const packageServiceValues = input.includedServices.map(serviceId => [packageId, serviceId]);
                 await connection.query(
                    'INSERT INTO PackageServices (package_id, service_id) VALUES ?',
                    [packageServiceValues]
                );
            }
        }

        await connection.commit();
        logger.info({ packageId }, 'Package updated successfully');
        return (await getPackageById(pool, packageId))!;

    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, packageId, input }, 'Error updating package');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not update package due to a server error', false);
    } finally {
        connection.release();
    }
};

export const deletePackageById = async (pool: Pool, packageId: number): Promise<{ success: boolean, message: string }> => {
    logger.debug({ packageId }, 'Deleting package');
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // PackageServices จะถูกลบอัตโนมัติถ้าตั้ง ON DELETE CASCADE

        // ตรวจสอบว่ามี Bookings อ้างอิงอยู่หรือไม่ (ถ้ามีตารางที่เชื่อมโยง)
        // const [bookingRefs] = await connection.query('SELECT booking_id FROM Bookings WHERE package_id = ? LIMIT 1', [packageId]);
        // if (bookingRefs.length > 0) throw new ApiError(400, 'Cannot delete package: It has existing bookings.');

        const [result] = await connection.query<ResultSetHeader>(
            'DELETE FROM Packages WHERE package_id = ?',
            [packageId]
        );
        if (result.affectedRows === 0) {
            await connection.rollback();
            throw new NotFoundError('Package not found for deletion.');
        }
        await connection.commit();
        logger.info({ packageId }, 'Package deleted successfully');
        return { success: true, message: 'Package deleted successfully.' };
    } catch (error: any) {
        await connection.rollback();
        logger.error({ err: error, packageId }, 'Error deleting package');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not delete package due to a server error', false);
    } finally {
        connection.release();
    }
};