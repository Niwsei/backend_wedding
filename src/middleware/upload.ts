// src/middleware/upload.ts
import multer, { FileFilterCallback, Multer } from 'multer';
import path from 'path';
import fs from 'fs'; // File system module
import { Request } from 'express';
import ApiError from '../errors/apiError'; // Import ApiError ของคุณ
import logger from '../utils/logger';

// --- กำหนดโฟลเดอร์สำหรับเก็บไฟล์ที่ Upload ---
const UPLOAD_DIR = path.join(__dirname, '../../uploads'); // สร้างโฟลเดอร์ 'uploads' ที่ Root ของโปรเจกต์

// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
if (!fs.existsSync(UPLOAD_DIR)) {
    try {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        logger.info(`Upload directory created at: ${UPLOAD_DIR}`);
    } catch (error) {
        logger.error({ error }, `Failed to create upload directory at: ${UPLOAD_DIR}`);
        // อาจจะ throw error หรือจัดการตามความเหมาะสม
    }
}


// --- ตั้งค่า Storage Engine ของ Multer ---
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        cb(null, UPLOAD_DIR); // เก็บไฟล์ในโฟลเดอร์ 'uploads'
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน (เช่น timestamp + originalname)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname); // นามสกุลไฟล์เดิม
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

// --- ตั้งค่า File Filter ---
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // อนุญาตเฉพาะไฟล์รูปภาพประเภทที่กำหนด
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'  || file.mimetype === 'image/jpg' || file.mimetype === 'image/gif' || file.mimetype === 'image/webp') {
        cb(null, true); // Accept file
    } else {
        logger.warn({ mimetype: file.mimetype, originalName: file.originalname }, 'File upload rejected: Invalid file type');
        cb(new ApiError(400, 'Invalid file type. Only JPEG, PNG, GIF, WEBP images are allowed.', true)); // Reject file
    }
};

// --- สร้าง Multer Instance ---
const upload: Multer = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // จำกัดขนาดไฟล์ไม่เกิน 5MB (ปรับตามต้องการ)
    },
    fileFilter: fileFilter
});

export default upload; // Export Multer instance