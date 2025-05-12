import { Request, Response, NextFunction } from 'express';
import { getUserProfileById, updateUserProfileById } from '../services/user.service';
import pool from '../config/db';
import logger from '../utils/logger';
import { UpdateProfileInput } from '../schemas/user.schema';

export const getMyProfileHandler = async (
    req: Request, // ไม่ต้องระบุ Type Input เพราะไม่มี Body/Params
    res: Response,
    next: NextFunction
) => {
    // Middleware 'authenticate' ควรจะทำงานก่อนหน้านี้ และใส่ req.user ไว้แล้ว
    const userId = req.user?.userId; // ดึง userId จาก req.user ที่ middleware แนบมา

    // ตรวจสอบเผื่อว่า middleware authenticate มีปัญหา หรือไม่ได้ใส่ req.user
    if (!userId) {
         logger.error('getMyProfileHandler called without authenticated user ID in req.user');
         // ส่งต่อไปยัง Error Handler หรือ return 401 โดยตรง
         return next(new Error('Authentication required but user ID not found in request.')); // หรือ UnauthorizedError
    }

    try {
        const userProfile = await getUserProfileById(pool, userId);
        return res.status(200).json({ status: 'success', data: { user: userProfile } });
    } catch (error) {
        // ส่ง error (เช่น NotFoundError, ApiError) ไปให้ errorHandler จัดการ
        return next(error);
    }
};

export const updateMyProfileHandler = async (req: Request<{}, {}, UpdateProfileInput> /* ระบุ Type ของ Request Body*/, res: Response, next: NextFunction) => {

    const user_id = req.user?.userId;

    if(!user_id){
           logger.error('updateMyProfileHandler called without authenticated user ID');
        return next(new Error('Authentication required but user ID not found in request.'));
    }

    try {
        const updatedProfile = await updateUserProfileById(pool, user_id, req.body)
        return res.status(200).json({
            status: 'success', 
            data: { user: updatedProfile } 
        })
    } catch (error) {
        return next(error);
    }
}



// --- เพิ่ม Handler สำหรับ Update Profile ที่นี่ในอนาคต ---
// export const updateMyProfileHandler = async (
//     req: Request<{}, {}, UpdateProfileInput>, // รับ Input จาก Schema
//     res: Response,
//     next: NextFunction
// ) => {
//     const userId = req.user?.userId;
//     if (!userId) { /* ... handle error ... */ }
//
//     try {
//         const updatedProfile = await updateUserProfile(pool, userId, req.body);
//         return res.status(200).json({ status: 'success', data: { user: updatedProfile } });
//     } catch (error) {
//         return next(error);
//     }
// };