// src/services/inspiration.service.ts
import { Pool, RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import logger from '../utils/logger';
import ApiError from '../errors/apiError';
import NotFoundError from '../errors/notFoundError';
import BadRequestError from '../errors/badRequestError';

// Interface สำหรับข้อมูล Gallery Item ที่ถูกบันทึกเป็น Inspiration
// อาจจะเหมือนกับ Interface ของ GalleryItem หรือดึงเฉพาะ Field ที่จำเป็น
export interface SavedInspirationItem extends RowDataPacket {
     item_id: number;
    image_url: string;
    title: string | null;
    // เพิ่ม field อื่นๆ จาก GalleryItems ที่ต้องการแสดงในหน้า Saved Inspiration
}

/**
 * ดึงรายการ Saved Inspirations ทั้งหมดของ User
 */

export const getUserSavedInspirations = async (pool: Pool, user_id: number): Promise<SavedInspirationItem[]> => {
     logger.debug({ user_id }, 'Fetching saved inspirations for user');
     try {
         // JOIN กับตาราง GalleryItems เพื่อดึงข้อมูลของ Item ที่บันทึกไว้
         const [rows] = await pool.query<SavedInspirationItem[]>(
            `SELECT
             gi.item_id,
             gi.image_url,
             gi.title
             FROM UserSavedInspirations usi
             JOIN GalleryItems gi ON usi.item_id = gi.item_id
             WHERE usi.user_id = ? AND gi.is_active = TRUE
             ORDER BY usi.saved_at DESC`, [user_id]  // เรียงตามวันที่บันทึกล่าสุด
         )
         return rows;
     } catch (error: any) {
        logger.error({ err: error, user_id }, 'Error fetching user saved inspirations');
        throw new ApiError(500, 'Could not retrieve saved inspirations due to a server error', false);
     }
}


/**
 * บันทึก (Like) Gallery Item เป็น Inspiration
 */

export const saveInspirationForItem = async (pool: Pool, user_id: number, itemId: number): Promise<{ success: boolean; message: string; inspiration?: SavedInspirationItem }> => {
     logger.debug({ user_id, itemId }, 'Saving inspiration for item');
        let connection: PoolConnection | undefined
     try {
        connection = await pool.getConnection();
            await connection.beginTransaction()

         // 1. ตรวจสอบว่า Gallery Item ID นี้มีอยู่จริงและ Active
         const  [galleryItemCheck] = await connection.query<RowDataPacket[]>(
            `SELECT item_id FROM GalleryItems WHERE item_id = ? AND is_active = TRUE`, [itemId]
         )
         if(galleryItemCheck.length === 0){
            await connection.rollback();
            throw new NotFoundError(`Gallery item with ID ${itemId} not found or is not active.`);
         }
        
        // 2. พยายาม Insert (ถ้ายังไม่มี)
        // ใช้ IGNORE เพื่อไม่ให้เกิด Error ถ้ามี Record ซ้ำอยู่แล้ว (User กด Like ซ้ำ)
        const sql = 'INSERT IGNORE INTO UserSavedInspirations (user_id, item_id) VALUES (?, ?)';
        const [result] = await connection.query<ResultSetHeader>(sql,[user_id, itemId])

        await connection.commit();

        if(result.affectedRows > 0){
              logger.info({ user_id, itemId }, 'Inspiration saved successfully.');
            // ดึงข้อมูล Item ที่เพิ่งบันทึกกลับไป (Optional)
            const [savedItemRows] = await connection.query<SavedInspirationItem[]>(
                `SELECT gi.item_id, gi.image_url, gi.title FROM GalleryItems gi WHERE gi.item_id = ?`, [itemId]
            )
            return {
                success: true,
                message: 'Inspiration saved successfully.',
                inspiration: savedItemRows.length > 0 ? savedItemRows[0] : undefined
            }
        } else {
             logger.info({ user_id, itemId }, 'Inspiration was already saved.');
            // ดึงข้อมูล Item ที่มีอยู่แล้วกลับไป (Optional)
            const [existingItemRows] = await connection.query<SavedInspirationItem[]>(
                `SELECT gi.item_id, gi.image_url, gi.title FROM GalleryItems gi WHERE gi.item_id = ?`,[itemId]
            );
            return {
                success: true,
                message: 'Inspiration was already saved.',
                inspiration: existingItemRows.length > 0 ? existingItemRows[0] : undefined
            };
        }

     } catch (error: any) {
           if(connection) await connection.rollback();
        logger.error({ err: error, user_id, itemId }, 'Error saving inspiration');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not save inspiration due to a server error', false);
    } finally {
        if(connection) connection.release();
    }
}



/**
 * ลบ (Unlike) Gallery Item ออกจาก Saved Inspirations
 */


export const deleteInspirationForItem = async (pool: Pool, user_id: number, itemId: number): Promise<{success: boolean; message: string}> => {
       logger.debug({ user_id, itemId }, 'Deleting inspiration for item');
       let connection: PoolConnection | undefined

       try {

            connection = await pool.getConnection();
            await connection.beginTransaction();

            const [result] = await connection.query<ResultSetHeader>(
                `DELETE FROM UserSavedInspirations WHERE user_id = ? AND item_id = ?
                `, [user_id, itemId]
            )
                await connection.commit();

                if(result.affectedRows > 0){
                     logger.info({ user_id, itemId }, 'Inspiration deleted successfully.');
            return { success: true, message: 'Inspiration removed successfully.' };
                }else {
                       // อาจจะหมายความว่า User ไม่เคย Save Item นี้ไว้ หรือ Item ID ไม่มีอยู่
            logger.warn({ user_id, itemId }, 'No inspiration found to delete for this user and item.');
                throw new NotFoundError('Inspiration not found for this item or already removed.');
                }
        
       } catch (error: any) {
       if(connection) await connection.rollback();
        logger.error({ err: error, user_id, itemId }, 'Error deleting inspiration');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not remove inspiration due to a server error', false);
    } finally {
       if(connection) connection.release();
    }
        
       }
