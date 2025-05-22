// src/controllers/package.controller.ts
import { Request, Response, NextFunction, RequestHandler } from 'express'; // <-- Import RequestHandler
import pool from '../config/db';
import {
    getAllPackages,
    getPackageById,
    createPackage,
    updatePackageById,
    deletePackageById
} from '../services/package.service';
import { GetAllPackagesQuery, GetPackageParams, CreatePackageInput, UpdatePackageInput } from '../schemas/package.schema';
import NotFoundError from '../errors/notFoundError';
import logger from '../utils/logger'; // Import logger

// ใช้ RequestHandler สำหรับ Type ของ Handler ทั้งหมด
export const getAllPackagesHandler: RequestHandler = async (req, res, next): Promise<void> => {
    // req.query ควรจะมี Type ที่ Zod validate มาให้แล้ว หรือ Cast ถ้าจำเป็น
    const queryParams = req.query as GetAllPackagesQuery; // Cast หรือปล่อยให้ Zod จัดการ
    try {
        const packages = await getAllPackages(pool, queryParams);
         res.status(200).json({ status: 'success', results: packages.length, data: { packages } });
    } catch (error) {
        return next(error);
    }
};

export const getPackageByIdHandler: RequestHandler = async (req, res, next): Promise<void> => {
    // req.params.packageId ควรจะถูก Zod coerce เป็น number แล้ว
    const packageId = parseInt(req.params.packageId as string, 10); // หรือ (req.params as unknown as GetPackageParams).packageId
    if (isNaN(packageId) || packageId <=0) {
        return next(new NotFoundError('Invalid Package ID format'));
    }
    try {
        const pkg = await getPackageById(pool, packageId);
        if (!pkg) {
            return next(new NotFoundError('Package not found'));
        }
         res.status(200).json({ status: 'success', data: { package: pkg } });
    } catch (error) {
        return next(error);
    }
};

export const createPackageHandler: RequestHandler = async (req, res, next): Promise<void> => {
    // req.body ควรจะมี Type เป็น CreatePackageInput หลังจากผ่าน Zod validation
    const bodyData = req.body as CreatePackageInput;
    try {
        const newPackage = await createPackage(pool, bodyData);
         res.status(201).json({ status: 'success', data: { package: newPackage } });
    } catch (error) {
        return next(error);
    }
};

export const updatePackageHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const packageId = parseInt(req.params.packageId as string, 10);
    const bodyData = req.body as UpdatePackageInput;

    if (isNaN(packageId) || packageId <=0) {
        return next(new NotFoundError('Invalid Package ID format for update'));
    }
    try {
        const updatedPackage = await updatePackageById(pool, packageId, bodyData);
         res.status(200).json({ status: 'success', data: { package: updatedPackage } });
    } catch (error) {
        return next(error);
    }
};

export const deletePackageHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const packageId = parseInt(req.params.packageId as string, 10);
     if (isNaN(packageId) || packageId <=0) {
        return next(new NotFoundError('Invalid Package ID format for delete'));
    }
    try {
        const result = await deletePackageById(pool, packageId);
         res.status(200).json({ status: 'success', message: result.message });
    } catch (error) {
        return next(error);
    }
};