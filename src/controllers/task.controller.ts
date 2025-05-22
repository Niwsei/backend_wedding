// src/controllers/task.controller.ts
import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import {
    getUserTasks,
    createTaskForUser,
    updateTaskById,
    deleteTaskById
} from '../services/task.service';
import { CreateTaskInput, UpdateTaskInput, UpdateTaskParams, TaskParams } from '../schemas/task.schema';
import logger from '../utils/logger';

export const getMyTasksHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) return next(new Error('User ID not found in request (authentication error)'));

    try {
        const tasks = await getUserTasks(pool, userId);
         res.status(200).json({ status: 'success', data: { tasks } });
    } catch (error) {
        return next(error);
    }
};

export const createTaskHandler = async (
    req: Request<{}, {}, CreateTaskInput>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) return next(new Error('User ID not found in request (authentication error)'));

    try {
        const newTask = await createTaskForUser(pool, userId, req.body);
         res.status(201).json({ status: 'success', data: { task: newTask } });
    } catch (error) {
        return next(error);
    }
};

export const updateTaskHandler = async (
    // ระบุ Type ให้ req.params ด้วย
    req: Request<{taskId: string}, any, UpdateTaskInput, any>,
    res: Response,
    next: NextFunction
) => {
    const userId = req.user?.userId;
    const taskId = parseInt(req.params.taskId, 10); // หรือปล่อยให้ Zod จัดการ

    if (!userId) return next(new Error('User ID not found in request (authentication error)'));
        if (isNaN(taskId)) return next(new Error('Invalid Task ID in URL'));

    try {
        const updatedTask = await updateTaskById(pool, userId, taskId, req.body);
         res.status(200).json({ status: 'success', data: { task: updatedTask } });
    } catch (error) {
        return next(error);
    }
};

export const deleteTaskHandler = async (
    req: Request<{ taskId: string }, any, any, any>, // ใช้ TaskParams สำหรับ req.params
    res: Response,
    next: NextFunction
): Promise<void> => {
    const userId = req.user?.userId;
    const taskId = parseInt(req.params.taskId, 10);

   if (!userId) {
        logger.error('Delete task failed: Authenticated User ID not found in request.');
        return next(new Error('User ID not found in request (authentication error)'));
    }
    if (isNaN(taskId)) {
          logger.error('Delete task failed: Task ID not found in request parameters.');
        return next(new Error('Invalid Task ID in URL'))
    };

      logger.debug(`Controller: Attempting to delete task. Authenticated UserID: ${userId}, TaskID to Delete: ${taskId}`);

    try {
        const result = await deleteTaskById(pool, taskId, userId);
         res.status(200).json({ status: 'success', message: result.message }); // หรือ status 204 No Content
    } catch (error) {
        return next(error);
    }
};