import express, {RequestHandler} from 'express';
import { getMyProfileHandler, updateMyProfileHandler } from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate'; // <-- Import Middleware
import { validateRequest } from '../middleware/validateRequest';
import { UpdateProfileSchema } from '../schemas/user.schema';
// import { validateRequest } from '../middleware/validateRequest'; // <-- Import ถ้าจะใช้กับ Route อื่น
// import { UpdateProfileSchema } from '../schemas/user.schema'; // <-- Import ถ้าจะใช้กับ Route อื่น

const router = express.Router();

// ใช้ authenticate middleware กับ *ทุก* route ในไฟล์นี้ หรือเฉพาะ route ที่ต้องการ
router.use(authenticate); // <-- ใช้ middleware กับทุก routes ข้างล่างนี้

// GET /api/users/me
router.get('/me', getMyProfileHandler as RequestHandler); // <-- ใช้ authenticate middleware
router.put(
    '/me',
    validateRequest({ body: UpdateProfileSchema.shape.body }), updateMyProfileHandler
     // <-- ตรวจสอบการเรียกใช้
);

// --- เพิ่ม Routes อื่นๆ สำหรับ User ที่นี่ (ต้องผ่าน authenticate แล้ว) ---
// PUT /api/users/me
// router.put('/me', validateRequest({ body: UpdateProfileSchema.shape.body }), updateMyProfileHandler);

// GET /api/users/me/tasks
// router.get('/me/tasks', getMyTasksHandler); // ต้องสร้าง Controller/Service เพิ่ม

// ... routes อื่นๆ ...

export default router;