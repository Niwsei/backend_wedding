import { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import logger from "../utils/logger";
import ApiError from "../errors/apiError";
import NotFoundError from "../errors/notFoundError";
import { UpdateBudgetCategorySpentInput } from "../schemas/budget.schema";

// Interface สำหรับข้อมูลแต่ละ Budget Category ที่ดึงมาจาก DB
export interface BudgetCategoryData extends RowDataPacket {
     category_id: number;
    name: string; // ชื่อ Category
    spent_amount: number; // ยอดใช้จ่ายใน Category นี้ของ User
    // notes: string | null; // ถ้ามี
}

// Interface สำหรับข้อมูล Budget Overview ทั้งหมด
export interface BudgetOverview extends RowDataPacket {
    total_budget: number | null; // จากตาราง Users
    total_spent: number;         // คำนวณจากผลรวม spent_amount ของทุก categories
    categories: BudgetCategoryData[]; // รายการแต่ละ Category พร้อมยอดใช้จ่าย
}


/**
 * ดึงข้อมูล Budget Overview ของ User
 */

export const getUserBudgetOverview = async (pool: Pool, user_id: number): Promise<BudgetOverview> => {
     logger.debug({ user_id }, 'Fetching budget overview for user');
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

         // 1. ดึง Total Budget ของ User จากตาราง Users
         const [userRows] = await connection.query<RowDataPacket[]> ('SELECT total_budget FROM Users WHERE user_id = ?', [user_id])
         if(userRows.length === 0) {
            await connection.rollback();
              throw new NotFoundError('User not found for budget overview');
         }

         const totalBudget = userRows[0].total_budget as number | null;

         // 2. ดึงรายการ Budget Categories ทั้งหมด พร้อมกับ spent_amount ของ User คนนี้ (LEFT JOIN)
        // ถ้า User ยังไม่มี Entry ใน UserBudgetEntries สำหรับ Category นั้น spent_amount จะเป็น NULL

        const [categoryRows] = await  connection.query<BudgetCategoryData[]>(`SELECT
                 bc.category_id,
                 bc.name,
                 COALESCE(ube.spent_amount, 0) AS spent_amount FROM BudgetCategories bc
                 LEFT JOIN UserBudgetEntries ube ON bc.category_id = ube.category_id AND ube.user_id = ? 
                 ORDER BY bc.category_id ASC `, [user_id]);

                 // 3. คำนวณ Total Spent
                 const totalSpent = categoryRows.reduce((sum, cat) => sum + (cat.spent_amount || 0 ), 0)

                 await connection.commit();

                 return {
                    total_budget: totalBudget,
                    total_spent: totalSpent,
                    categories: categoryRows
                 } as BudgetOverview 


    } catch (error: any) {
      await connection.rollback();
        logger.error({ err: error, user_id }, 'Error fetching user budget overview');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not retrieve budget overview due to a server error', false);
    } finally {
        connection.release();
    }
}


export const updateUserBudgetCategorySpent = async (pool: Pool, user_id: number, categoryId: number ,input: UpdateBudgetCategorySpentInput): Promise<BudgetCategoryData> => {
    const  { spentAmount } = input;
     logger.debug({ user_id, categoryId, spentAmount }, 'Updating user budget category spent amount');

      // ใช้ ON DUPLICATE KEY UPDATE เพื่อ Insert ถ้ายังไม่มี หรือ Update ถ้ามีอยู่แล้ว
    // ต้องมั่นใจว่า (user_id, category_id) เป็น UNIQUE KEY ในตาราง UserBudgetEntries
    const sql  = `
    INSERT INTO UserBudgetEntries (user_id, category_id, spent_amount) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE spent_amount = VALUES(spent_amount), last_updated = NOW()
    `// ถ้ามี notes: ON DUPLICATE KEY UPDATE spent_amount = VALUES(spent_amount), notes = VALUES(notes), last_updated = NOW()

    const connection = await pool.getConnection();

    try {
         await connection.beginTransaction();

        // 1. ตรวจสอบว่า Category ID มีอยู่จริงใน BudgetCategories (Optional แต่ดี)
        const [categoryCheck] = await connection.query<RowDataPacket[]>(
            'SELECT category_id FROM BudgetCategories WHERE category_id = ?', [categoryId]
        );
        if(categoryCheck.length === 0) {
            await connection.rollback();
            throw new NotFoundError(`Budget category with ID ${categoryId} not found.`);
        }

        // 2. ทำการ Insert หรือ Update
        const [result] = await connection.query<ResultSetHeader>(sql, [user_id, categoryId, spentAmount]);
          // (result.affectedRows จะเป็น 1 ถ้า Insert, 2 ถ้า Update (ใน MySQL))
        if (result.affectedRows === 0) { // ควรจะเป็น 1 หรือ 2
            await connection.rollback();
            throw new ApiError(500, 'Failed to update budget category spent amount.', false);    
        }

         // 3. ดึงข้อมูล Category ที่อัปเดตแล้วกลับมาแสดง
         const [updatedCategoryRows] = await connection.query<BudgetCategoryData[]>(
            `SELECT 
            bc.category_id,
            bc.name,
            ube.spent_amount
            FROM BudgetCategories bc
            JOIN UserBudgetEntries ube ON bc.category_id = ube.category_id
            WHERE ube.user_id = ? AND ube.category_id = ?`,
            [user_id, categoryId]
         );
          if (updatedCategoryRows.length === 0) {
            // ไม่ควรเกิดขึ้นถ้า Insert/Update สำเร็จ
            await connection.rollback();
            throw new ApiError(500,'Failed to retrieve updated budget category information.', false);
        }

        await connection.commit();
        logger.info({ user_id, categoryId, spentAmount }, 'User budget category spent amount updated successfully');
        return updatedCategoryRows[0];
         

    } catch (error: any) {
      await connection.rollback();
        logger.error({ err: error, user_id, categoryId, input }, 'Error updating user budget category spent');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not update budget category due to a server error', false);
    } finally {
        connection.release();
    }

}