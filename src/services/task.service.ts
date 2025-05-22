import { Pool, RowDataPacket, ResultSetHeader, PoolConnection } from "mysql2/promise";
import logger from "../utils/logger";
import ApiError from "../errors/apiError";
import NotFoundError from "../errors/notFoundError";
import { CreateTaskInput, UpdateTaskInput } from "../schemas/task.schema";

export interface Task extends RowDataPacket{
    task_id: number;
    user_id: number;
    title: string;
    due_description: string | null;
    due_date: Date | null;
    is_completed: boolean; // หรือ TINYINT(1) ใน DB
    notes: string | null;
    created_at: Date;
    updated_at: Date;
}

export const getUserTasks = async (pool: Pool, user_id: number): Promise<Task[]> => {
    logger.debug({user_id}, 'Fetching tasks for user') 

    try {
        const [rows] = await pool.query<Task[]>('SELECT * FROM UserTasks WHERE user_id = ? ORDER BY created_at DESC', [user_id])
        return rows;
    } catch (error: any) {
          logger.error({ err: error, user_id }, 'Error fetching user tasks');
        throw new ApiError(500, 'Could not retrieve tasks due to a server error', false);   
    }

}


export const createTaskForUser = async (pool: Pool, user_id: number, input: CreateTaskInput): Promise<Task> => {
    const { title, dueDescription, dueDate, notes } = input;
    logger.debug({ user_id, title }, 'Creating new task for user')
    let connection: PoolConnection | undefined; // <-- ประกาศ Connection

    try {
         connection = await pool.getConnection(); // <-- ใช้ await
        await connection.beginTransaction(); // <-- เรียกบน Connection ที่ได้มา

        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO UserTasks (user_id, title, due_description, due_date, notes) VALUES (?, ?, ?, ?, ?)',
            [user_id, title, dueDescription, dueDate ? new Date(dueDate) : null, notes]
        );
            const insertId = result.insertId
            if(!insertId){
                await connection.rollback();
                throw new ApiError(500, 'Failed to create new task.', false)
            }

            // ดึง Task ที่เพิ่งสร้างกลับมา
            const [rows] = await connection.query<Task[]>(
                'SELECT * FROM UserTasks WHERE task_id = ?', [insertId]
            )
            await connection.commit();
            logger.info({ taskId: insertId, user_id, title }, 'Task created successfully')
            return rows[0];

    } catch (error: any) {
        if (connection) await connection.rollback(); // <-- Rollback ถ้ามี Connection
        logger.error({ err: error, user_id, input }, 'Error creating task');
        throw new ApiError(500, 'Could not create task due to a server error', false);
    }finally {
         if (connection) connection.release(); // <-- คืน Connection
    }
}

export const updateTaskById = async (pool: Pool, user_id: number, taskId: number, input: UpdateTaskInput): Promise<Task> => {
    logger.debug({ user_id, taskId, input }, 'Attempting to update task');

    const fieldsToUpdate: {[key: string]: any} = {};
    const queryParams: any[] = []

      // แมป Input Keys กับ Database Column Names
      const fieldMap: { [key in keyof UpdateTaskInput]?: string } = {
         title: 'title',
        dueDescription: 'due_description',
        dueDate: 'due_date',
        notes: 'notes',
        isCompleted: 'is_completed'
      };

      for(const key in input){
          if(Object.prototype.hasOwnProperty.call(input, key) && input[key as keyof UpdateTaskInput] !== undefined){
            const dbField = fieldMap[key as keyof UpdateTaskInput];
            if(dbField){
                 // แปลง isCompleted เป็น 0/1 ถ้า DB เป็น TINYINT
                // แปลง dueDate เป็น Date object
                fieldsToUpdate[dbField] = (dbField === 'due_date' && input.dueDate)
                ? new Date(input.dueDate) : (dbField === 'is_completed') ? (input.isCompleted ? 1 : 0) : input[key as keyof UpdateTaskInput]
            }
        }
      }

      if(Object.keys(fieldsToUpdate).length === 0) {
         logger.warn({ user_id, taskId }, 'No valid fields provided for task update.');
        // ดึง Task ปัจจุบันกลับไปถ้าไม่มีอะไรอัปเดต

        const [currentTaskRows] = await pool.query<Task[]>('SELECT * FROM UserTasks WHERE task_id = ? AND user_id = ?', [taskId, user_id])
         if (currentTaskRows.length === 0) throw new NotFoundError('Task not found or does not belong to user');
        return currentTaskRows[0];  
      }

      const setClauses = Object.keys(fieldsToUpdate).map(field => `${field} = ?`).join(', ')
            queryParams.push(...Object.values(fieldsToUpdate));
            queryParams.push(taskId)
            queryParams.push(user_id)  // เพื่อความปลอดภัยว่าอัปเดตเฉพาะ Task ของ User คนนี้

            const sql = `UPDATE UserTasks SET ${setClauses}, updated_at = NOW() WHERE task_id = ? AND user_id = ?`

            let connection: PoolConnection | undefined

            try {

               connection = await pool.getConnection(); // <-- ใช้ await
         await connection.beginTransaction();

                const [result] = await connection.query<ResultSetHeader>(sql, queryParams);

                if(result.affectedRows === 0){
                    await connection.rollback();
                    throw new NotFoundError('Task not found or you do not have permission to update it.')

                }

                await connection.commit();
                  logger.info({ user_id, taskId }, 'Task updated successfully');
                  const [updatedTaskRows] = await pool.query<Task[]>('SELECT * FROM UserTasks WHERE task_id = ?', [taskId])
                  return updatedTaskRows[0];
                
            } catch (error: any) {
             if (connection) await connection.rollback();
        logger.error({ err: error, user_id, taskId, input }, 'Error updating task');
        if (error instanceof ApiError) { throw error; }
        throw new ApiError(500, 'Could not update task due to a server error', false);
    } finally {
        if (connection) connection.release();
    }
}


export const deleteTaskById = async (pool: Pool, taskId: number, user_id: number ): Promise<{success: boolean, message: string}> => {
    logger.debug({ user_id, taskId }, 'Attempting to delete task');
  let connection: PoolConnection | undefined; // <-- ประกาศ Connection
    try {
         connection = await pool.getConnection(); // <-- ใช้ await
        await connection.beginTransaction();
 // ตรวจสอบว่า Task เป็นของ User คนนี้จริงก่อนลบ
 const [result] = await connection.query<ResultSetHeader>('DELETE FROM UserTasks WHERE task_id = ? AND user_id = ?', [taskId, user_id])
        if(result.affectedRows === 0){
                await connection.rollback();
                 throw new NotFoundError('Task not found or you do not have permission to delete it.');
        }
           await connection.commit();
        logger.info({user_id, taskId }, 'Task deleted successfully');
        return { success: true, message: 'Task deleted successfully.' };

    } catch (error: any) {
       if (connection) await connection.rollback();
        logger.error({ err: error, user_id, taskId }, 'Error deleting task');
        if (error instanceof ApiError) { throw error; }
        throw new ApiError(500, 'Could not delete task due to a server error', false);
    } finally {
       if (connection) connection.release();
    }
}