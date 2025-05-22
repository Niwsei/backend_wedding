// ນຳເຂົ້າ object ປະເພດ Request, Response, ແລະ NextFunction ຈາກ library 'express'.
// ເຫຼົ່ານີ້ແມ່ນ object ຫຼັກທີ່ middleware ຂອງ Express ໃຊ້ງານ.
import {  RequestHandler } from 'express';

// ນຳເຂົ້າ default export (ເຊິ່ງຄາດວ່າຈະເປັນ object `jwt`) ຈາກ library 'jsonwebtoken'.
// library ນີ້ໃຊ້ສຳລັບສ້າງ (sign) ແລະ ກວດສອບຄວາມຖືກຕ້ອງ (verify) ຂອງ JSON Web Tokens (JWT).
import jwt from 'jsonwebtoken';

// ນຳເຂົ້າ default export (ເຊິ່ງຄາດວ່າຈະເປັນ object `config`) ຈາກ file `config` ໃນລະດັບເທິງໜຶ່ງຂັ້ນ (`../`).
// object `config` ນີ້ຄາດວ່າຈະບັນຈຸຄ່າຕັ້ງຄ່າຕ່າງໆ ເຊັ່ນ `JWT_SECRET`.
import config from '../config';

import pool from '../config/db';

// ນຳເຂົ້າ class `UnauthorizedError` ຈາກ file `unauthorizedError` ໃນ folder `errors`.
// ນີ້ແມ່ນ class ຂໍ້ຜິດພາດທີ່ກຳນົດເອງ ເພື່ອໃຊ້ສະເພາະເມື່ອການ authentication ລົ້ມເຫຼວ.
import UnauthorizedError from '../errors/unauthorizedError';

import { RowDataPacket } from 'mysql2';

// ນຳເຂົ້າ `logger` ຈາກ file `logger` ໃນ folder `utils`.
// ໃຊ້ເພື່ອບັນທຶກ (log) ຂໍ້ມູນການເຮັດວຽກ ຫຼື ຂໍ້ຜິດພາດຕ່າງໆ.
import logger from '../utils/logger';

// ຂະຫຍາຍ (Extend) type `Request` ຂອງ Express ທີ່ມີຢູ່ແລ້ວ ໂດຍການເພີ່ມ property `user`.
// `declare global { ... }` ໃຊ້ເພື່ອປະກາດການປ່ຽນແປງໃນ global namespace.
declare global {
    // ພາຍໃນ namespace `Express`
    namespace Express {
        // ກຳນົດ interface `Request` ໃໝ່ (ເຊິ່ງຈະຖືກລວມເຂົ້າກັບໂຕເດີມ)
        interface Request {
            // ເພີ່ມ property `user` ທີ່ *ອາດຈະມີ* (`?` ໝາຍເຖິງ optional).
            // type ຂອງ `user` ເປັນ object ທີ່ມີ `userId` (ປະເພດ number),
            // `email` (ປະເພດ string, optional), `phoneNumber` (ປະເພດ string, optional),
            // ແລະ ສາມາດເພີ່ມ field ອື່ນໆໄດ້ເຊັ່ນ role (ຕາມ comment).
            // property `user` ນີ້ຈະຖືກໃຊ້ເພື່ອເກັບຂໍ້ມູນ payload ທີ່ຖອດລະຫັດໄດ້ຈາກ JWT.
            user?: { userId: number; email?: string; phoneNumber?: string; role?: string /* add role etc. */ };
        }
    }
}

interface UserWithRole extends RowDataPacket {
    user_role: string;
}

// ປະກາດ ແລະ export function middleware ຊື່ `authenticate`.
// Middleware ໃນ Express ເປັນ function ທີ່ຮັບ `req`, `res`, ແລະ `next` ເປັນ parameters.
// ມັນສາມາດເຂົ້າເຖິງ request/response objects, ແກ້ໄຂມັນ, ຢຸດ request-response cycle,
// ຫຼື ສົ່ງຕໍ່ control ໄປຍັງ middleware ຕໍ່ໄປໂດຍການເອີ້ນ `next()`.
export const authenticate: RequestHandler = async (req, res, next) => {
    // ເອົາຄ່າຂອງ HTTP header ຊື່ 'authorization' ຈາກ object `req.headers`.
    const authHeader = req.headers.authorization;

    // ກວດສອບວ່າ `authHeader` ມີຄ່າ ຫຼືບໍ່ ແລະ ມັນຂຶ້ນຕົ້ນດ້ວຍ 'Bearer ' (ພ້ອມຍະຫວ່າງ) ຫຼືບໍ່.
    // ຮູບແບບ "Bearer <token>" ເປັນມາດຕະຖານທົ່ວໄປສຳລັບການສົ່ງ JWT ໃນ Authorization header.
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('Authentication failed: No Bearer token provided');
        // ຖ້າ header ບໍ່ມີ ຫຼື ບໍ່ຖືກຮູບແບບ, ໃຫ້ສົ່ງຕໍ່ (pass) error ໄປຍັງ error handling middleware.
        // ສ້າງ instance ໃໝ່ຂອງ `UnauthorizedError` ພ້ອມຂໍ້ຄວາມ 'Authentication token required'.
        // `return` ໃຊ້ເພື່ອຢຸດການເຮັດວຽກຂອງ function `authenticate` ທີ່ຈຸດນີ້.
        return next(new UnauthorizedError('Authentication token required'));
    }

    // ແຍກ (split) string `authHeader` ດ້ວຍຍະຫວ່າງ ແລະ ເອົາສ່ວນທີສອງ ([1]) ເຊິ່ງກໍຄື token ຕົວຈິງ.
    const token = authHeader.split(' ')[1];

    if (!token) {
        logger.warn('Authentication failed: Token is empty after Bearer');
        return next(new UnauthorizedError('Token is missing'));
   }

    // ເລີ່ມຕົ້ນ block `try` ເພື່ອດັກຈັບ error ທີ່ອາດຈະເກີດຈາກ function `jwt.verify`.
    try {


        
        // ໃຊ້ function `verify` ຈາກ library `jwt` ເພື່ອກວດສອບຄວາມຖືກຕ້ອງຂອງ `token`.
        // ຕ້ອງສົ່ງ `token` ແລະ `config.JWT_SECRET` (ລະຫັດລັບທີ່ໃຊ້ຕອນສ້າງ token) ເຂົ້າໄປ.
        // ຖ້າ token ຖືກຕ້ອງ (ບໍ່ໝົດອາຍຸ, signature ຖືກຕ້ອງ), `verify` ຈະສົ່ງຄືນ payload ທີ່ຖອດລະຫັດແລ້ວ.
        // ໃຊ້ `as { ... }` ເພື່ອກຳນົດ type ທີ່ຄາດຫວັງຂອງ payload ທີ່ຖອດລະຫັດໄດ້.
        const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: number; email?: string; phoneNumber?: string; iat: number; exp: number /* add other payload fields */ };


         // ตรวจสอบว่า decoded มี userId หรือไม่ (สำคัญ)
         if (!decoded || typeof decoded.userId !== 'number') {
            logger.error({ decoded }, 'Authentication failed: Decoded token is invalid or missing userId');
            return next(new UnauthorizedError('Invalid token payload'));
       }

       const [userRows] = await pool.query<UserWithRole[]>(
         'SELECT user_role FROM Users WHERE user_id = ? LIMIT 1', [decoded.userId]
       )

       if(userRows.length === 0 || !userRows[0].user_role){
         logger.warn({ userId: decoded.userId }, 'Authentication failed: User not found or role missing in DB after token verification.');
            return next(new UnauthorizedError('User associated with token not found or has no role.'));
       }
       const userRole = userRows[0].user_role;

      
         req.user = {
            userId: decoded.userId,
            email: decoded.email, // มีถ้าตอน sign ใส่ email ไว้
            phoneNumber: decoded.phoneNumber, // มีถ้าตอน sign ใส่ phoneNumber ไว้
            role: userRole // เพิ่ม role ที่ได้จาก DB
        };
        // ບັນທຶກ (log) ຂໍ້ຄວາມລະດັບ debug ວ່າ user ໄດ້ຖືກ authenticate ສຳເລັດ, ພ້ອມກັບ userId.
        logger.debug({ userId: decoded.userId,role: userRole }, 'User authenticated');
        // ເອີ້ນ `next()` ໂດຍບໍ່ມີ parameter ເພື່ອສົ່ງຕໍ່ control ໄປຍັງ middleware ຫຼື route handler ຕໍ່ໄປໃນ chain.
        // ນີ້ໝາຍຄວາມວ່າການ authentication ສຳເລັດ.
        next(); // Authentication successful
    // ເລີ່ມຕົ້ນ block `catch` ເຊິ່ງຈະເຮັດວຽກຖ້າ `jwt.verify` ເກີດ error.
    } catch (error) {
        // ບັນທຶກ (log) ຂໍ້ຄວາມເຕືອນວ່າ JWT verification ລົ້ມເຫຼວ, ພ້ອມກັບ object ຂອງ error (`err: error`).
        logger.warn({ err: error }, 'JWT verification failed');
         // ກວດສອບວ່າ error ທີ່ເກີດຂຶ້ນແມ່ນ instance ຂອງ `jwt.TokenExpiredError` ຫຼືບໍ່.
         if (error instanceof jwt.TokenExpiredError) {
            // ຖ້າ token ໝົດອາຍຸ, ໃຫ້ສົ່ງ `UnauthorizedError` ພ້ອມຂໍ້ຄວາມ 'Token expired' ໃຫ້ `next()`.
            return next(new UnauthorizedError('Token expired'));
        }
        // ກວດສອບວ່າ error ທີ່ເກີດຂຶ້ນແມ່ນ instance ຂອງ `jwt.JsonWebTokenError` ຫຼືບໍ່
        // (ເຊິ່ງລວມເຖິງກໍລະນີ token ບໍ່ຖືກຮູບແບບ, signature ບໍ່ຖືກຕ້ອງ, ແລະ ອື່ນໆ).
        if (error instanceof jwt.JsonWebTokenError) {
            // ຖ້າ token ບໍ່ຖືກຕ້ອງ, ໃຫ້ສົ່ງ `UnauthorizedError` ພ້ອມຂໍ້ຄວາມ 'Invalid token' ໃຫ້ `next()`.
            return next(new UnauthorizedError('Invalid token'));
        }
        // ສຳລັບຂໍ້ຜິດພາດອື່ນໆທີ່ອາດຈະເກີດຂຶ້ນໃນລະຫວ່າງການກວດສອບ (ເຖິງແມ່ນວ່າຈະເກີດຂຶ້ນໄດ້ຍາກ).
        // ສົ່ງ `UnauthorizedError` ແບບທົ່ວໄປ ພ້ອມຂໍ້ຄວາມ 'Authentication failed' ໃຫ້ `next()`.
        return next(new UnauthorizedError('Authentication failed'));
    }
};