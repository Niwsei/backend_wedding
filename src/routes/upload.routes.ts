// src/routes/upload.routes.ts
import express, { Request, Response, NextFunction } from 'express';
import upload from '../middleware/upload'; // Import Multer middleware
import { authenticate } from '../middleware/authenticate'; // ต้อง Login ก่อน Upload
import logger from '../utils/logger';
import ApiError from '../errors/apiError';
import multer from 'multer'; // Import Multer for handling file uploads

const router = express.Router();

// POST /api/uploads/image
// Middleware `upload.single('imageFile')` หมายถึง:
// - คาดหวังว่าจะมี File ส่งมาใน Form Field ที่ชื่อ 'imageFile'
// - รับไฟล์เดียว (single)
// - ถ้า Upload สำเร็จ ข้อมูลไฟล์จะอยู่ใน req.file
router.post(
    '/image',
    authenticate, // ผู้ใช้ต้อง Login ก่อนถึงจะ Upload ได้
    upload.single('imageFile'), // 'imageFile' คือชื่อ field ใน form-data ที่ Client ส่งมา
    (req: Request, res: Response, next: NextFunction) => {
        if (!req.file) {
            // กรณีนี้ไม่ควรเกิดขึ้นถ้า Multer fileFilter ไม่ error แต่ Client ไม่ส่งไฟล์
            logger.warn('Image upload attempt without a file.');
            return next(new ApiError(400, 'No image file uploaded.', true));
        }

        // สร้าง URL หรือ Path ที่จะให้ Client เข้าถึงไฟล์นี้ได้
        // (สำคัญ: ต้องตั้งค่า Static File Serving ใน app.ts ด้วย)
        // BASE_URL อาจจะมาจาก .env หรือ Config
        const fileUrl = `/uploads/${req.file.filename}`; // Path relative to the server's static serving
        // หรือถ้าต้องการ Full URL:
        // const baseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
        // const fullFileUrl = `${baseUrl}/uploads/${req.file.filename}`;


        logger.info({ filename: req.file.filename, path: req.file.path, url: fileUrl }, 'Image uploaded successfully');
        res.status(201).json({
            status: 'success',
            message: 'Image uploaded successfully.',
            data: {
                filename: req.file.filename, // ชื่อไฟล์ที่ Server ตั้งให้
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path, // Path เต็มบน Server (อาจจะไม่จำเป็นต้องส่งให้ Client)
                url: fileUrl        // URL ที่ Client จะใช้เข้าถึงรูปภาพ
            }
        });
    },
    // Error handler เฉพาะสำหรับ Multer errors (เช่น File too large)
    (err: any, req: Request, res: Response, next: NextFunction) => {
        if (err instanceof multer.MulterError) {
            logger.warn({ error: err.message, field: err.field }, `Multer error during upload: ${err.code}`);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return next(new ApiError(400, 'File is too large. Maximum size allowed is 5MB.', true));
            }
            return next(new ApiError(400, `File upload error: ${err.message}`, true));
        } else if (err instanceof ApiError) { // Error จาก fileFilter
            return next(err);
        }
        // Error อื่นๆ
        return next(err);
    }
);

export default router;