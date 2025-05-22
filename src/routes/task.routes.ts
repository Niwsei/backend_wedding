// src/routes/task.routes.ts
import express from 'express';
import { authenticate } from '../middleware/authenticate';
import { validateRequest } from '../middleware/validateRequest';
import {
    CreateTaskSchema,
    UpdateTaskSchema,
    TaskParamsSchema
} from '../schemas/task.schema';
import {
    getMyTasksHandler,
    createTaskHandler,
    updateTaskHandler,
    deleteTaskHandler
} from '../controllers/task.controller';

const router = express.Router();

// ทุก Route ในนี้ต้องผ่านการ authenticate ก่อน
router.use(authenticate);

// GET /api/tasks (หรือ /api/users/me/tasks) - ดึง Tasks ทั้งหมดของ User ที่ Login อยู่
router.get('/', getMyTasksHandler);

// POST /api/tasks - สร้าง Task ใหม่
router.post('/', validateRequest({ body: CreateTaskSchema.shape.body }), createTaskHandler);

// PUT /api/tasks/:taskId - อัปเดต Task
router.put(
    '/:taskId',
    validateRequest({ params: TaskParamsSchema.shape.params, body: UpdateTaskSchema.shape.body }),
    updateTaskHandler
);

// DELETE /api/tasks/:taskId - ลบ Task
router.delete(
    '/:taskId',
    validateRequest({ params: TaskParamsSchema.shape.params }),
    deleteTaskHandler
);

export default router;