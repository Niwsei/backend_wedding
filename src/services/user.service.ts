import { OkPacket, OkPacketParams, Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import NotFoundError from '../errors/notFoundError';
import logger from '../utils/logger';
import ApiError from '../errors/apiError';

import { UpdateProfileInput } from '../schemas/user.schema';

// Interface สำหรับข้อมูล User ที่จะคืนค่า (ไม่รวม password_hash)
export interface UserProfile extends RowDataPacket {
    user_id: number;
    username: string | null;
    email: string | null;
    phone_number: string | null;
    full_name: string | null;
    avatar_url: string | null;
    user_role: string;
    wedding_date: Date | null; // Type เป็น Date
    planning_status: string | null;
    total_budget: number | null; // อาจจะเป็น number หรือ string ขึ้นกับ DECIMAL
    phone_verified_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

/* *
 * ดึงข้อมูล Profile ของ User ตาม ID
 * @param pool Database connection pool
 * @param userId ID ของ User ที่ต้องการดึงข้อมูล
 * @returns Promise<UserProfile> ข้อมูล Profile ของ User
 * @throws NotFoundError ถ้าไม่พบ User
 * @throws ApiError ถ้าเกิดข้อผิดพลาดอื่น
 */
export const getUserProfileById = async (pool: Pool, userId: number): Promise<UserProfile> => {
    logger.debug({ userId }, 'Fetching user profile by ID');
    try {
        // เลือกเฉพาะคอลัมน์ที่ต้องการแสดงผล ไม่เอา password_hash
        const [rows] = await pool.query<UserProfile[]>(
            `SELECT
                user_id, username, email, phone_number, full_name, avatar_url,
                user_role, wedding_date, planning_status, total_budget, phone_verified_at,
                created_at, updated_at
             FROM Users
             WHERE user_id = ? LIMIT 1`,
            [userId]
        );

        const userProfile = rows[0];

        if (!userProfile) {
            logger.warn({ userId }, 'User profile not found');
            throw new NotFoundError('User profile not found');
        }

        logger.debug({ userId }, 'User profile fetched successfully');
        return userProfile;

    } catch (error: any) {
        logger.error({ err: error, userId }, 'Error fetching user profile by ID');
         if (error instanceof ApiError) { // ถ้าเป็น Error ที่เรา throw เอง
             throw error;
         }
        // ถ้าเป็น Error อื่นจาก Database หรืออื่นๆ
        throw new ApiError(500, 'Could not retrieve user profile due to a server error', false);
    }
    // ไม่ต้อง release connection ที่นี่ เพราะ Controller จะจัดการผ่าน try/catch/finally ไม่ได้โดยตรง
    // การจัดการ connection ควรทำในระดับที่เรียกใช้ service หรือใช้ transaction wrapper
};


export const updateUserProfileById = async (pool: Pool, user_id: number, input: UpdateProfileInput): Promise<UserProfile> => {
    logger.debug({user_id, input}, 'Attempting to update user profile')

     // 1. ตรวจสอบว่า User มีอยู่จริงหรือไม่ก่อนอัปเดต
    // (อาจจะไม่จำเป็นถ้ามั่นใจว่า authenticate middleware ทำงานถูกต้อง แต่เป็นการป้องกันที่ดี)
    const existingUser = await getUserProfileById(pool, user_id)    
    if(!existingUser){
           // ส่วนนี้ไม่ควรจะเกิดขึ้นถ้า authenticate middleware ทำงานถูกต้อง
        throw new NotFoundError('User not found for update');
    }

    // 2. สร้างส่วน SET ของ SQL Query แบบ Dynamic
    // เพื่ออัปเดตเฉพาะ Field ที่ถูกส่งมาใน `input`
    const fieldsToUpdate: {[key:string]: any } = {};
    const queryParams: any[] = [];

    // แมป Input Keys กับ Database Column Names (ถ้าชื่อต่างกัน)
    const fieldMap: {[key in keyof UpdateProfileInput]?: string } = {
        fullName: 'full_name',
        username: 'username',
        avatarUrl: 'avatar_url',
        weddingDate: 'wedding_date',
        planningStatus: 'planning_status',
        totalBudget: 'total_budget'
    };

    for(const key in input ){
        if(Object.prototype.hasOwnProperty.call(input, key) && input[key as keyof UpdateProfileInput] !== undefined){
            const dbField = fieldMap[key as keyof UpdateProfileInput];
            if(dbField){
                fieldsToUpdate[dbField] = input[key as keyof UpdateProfileInput];
            }
        }
    }

    // ถ้าไม่มี Field ที่จะอัปเดต (ถึงแม้ Zod refine จะดักไว้แล้ว แต่เช็คอีกชั้นก็ดี)
    if(Object.keys(fieldsToUpdate).length === 0){
        logger.warn({ user_id }, 'No valid fields provided for profile update')
        return existingUser;
    }

     // สร้าง SQL SET clause
     const setClauses = Object.keys(fieldsToUpdate).map(field => `${field} = ?`).join(', ');
     queryParams.push(...Object.values(fieldsToUpdate));
     queryParams.push(user_id) // สำหรับ WHERE clause

     const sql = `UPDATE Users SET ${setClauses}, updated_at =  NOW() WHERE user_id = ?`;
     const connection = await pool.getConnection()
     try {
        await connection.beginTransaction();
        logger.debug({sql, queryParams}, 'Executing update user profile query')
        const [result] = await connection.query<ResultSetHeader>(sql, queryParams)
        

        if(result.affectedRows === 0 ){
            // ไม่ควรเกิดขึ้นถ้า getUserProfileById ทำงานถูกต้อง
            await connection.rollback();
            logger.warn({ user_id }, 'User profile update failed: No rows affected (user might have been deleted).');
            throw new NotFoundError('User not found, update failed.');
        }
         await connection.commit();
                 logger.info({ user_id }, 'User profile updated successfully.');
        // ดึงข้อมูล Profile ที่อัปเดตแล้วกลับไป
        return await getUserProfileById(pool, user_id)

     } catch (error: any) {
          await connection.rollback();
        logger.error({ err: error, user_id, input }, 'Error updating user profile');
         if (error instanceof ApiError) { throw error; }
        throw new ApiError(500, 'Could not update user profile due to a server error', false);
     } finally {
        connection.release();
     }
}
// --- เพิ่ม Service สำหรับ Update Profile ที่นี่ในอนาคต ---
// export const updateUserProfile = async (pool: Pool, userId: number, input: UpdateProfileInput): Promise<UserProfile> => {
//    // 1. สร้าง SQL UPDATE statement แบบ Dynamic หรือเลือก field ที่จะอัปเดต
//    // 2. รัน Query UPDATE
//    // 3. ดึงข้อมูล User ที่อัปเดตแล้วกลับมา (เหมือน getUserProfileById)
//    // 4. คืนค่า UserProfile ที่อัปเดตแล้ว
// }