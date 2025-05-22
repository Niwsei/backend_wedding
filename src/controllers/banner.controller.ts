// src/controllers/banner.controller.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import pool from '../config/db';
import {
    getAllBanners,
    createBanner,
    getBannerById, // Import if needed for admin view
    updateBannerById,
    deleteBannerById
} from '../services/banner.service';
import { GetAllBannersQuery, CreateBannerInput, UpdateBannerInput, UpdateBannerSchema, UpdateBannerParams } from '../schemas/banner.schema';
import NotFoundError from '../errors/notFoundError';

export const getAllBannersHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const queryParams = req.query as GetAllBannersQuery;
    try {
        const banners = await getAllBanners(pool, queryParams);
         res.status(200).json({ status: 'success', results: banners.length, data: { banners } });
    } catch (error) {
        return next(error);
    }
};

// --- Admin Handlers ---
export const createBannerHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const bodyData = req.body as CreateBannerInput;
    try {
        const newBanner = await createBanner(pool, bodyData);
         res.status(201).json({ status: 'success', data: { banner: newBanner } });
    } catch (error) {
        return next(error);
    }
};

export const getBannerByIdHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const bannerId = parseInt(req.params.bannerId as string, 10);
    if (isNaN(bannerId) || bannerId <=0) return next(new NotFoundError('Invalid Banner ID format'));
    try {
        const banner = await getBannerById(pool, bannerId);
        if (!banner) {
            return next(new NotFoundError('Banner not found'));
        }
         res.status(200).json({ status: 'success', data: { banner } });
    } catch (error) {
        return next(error);
    }
};

export const updateBannerHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const bannerId = parseInt(req.params.bannerId as string, 10);
    const bodyData = req.body as UpdateBannerInput;
    if (isNaN(bannerId) || bannerId <=0) return next(new NotFoundError('Invalid Banner ID format for update'));
    try {
        const updatedBanner = await updateBannerById(pool, bannerId, bodyData);
         res.status(200).json({ status: 'success', data: { banner: updatedBanner } });
    } catch (error) {
        return next(error);
    }
};

export const deleteBannerHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const bannerId = parseInt(req.params.bannerId as string, 10);
     if (isNaN(bannerId) || bannerId <=0) return next(new NotFoundError('Invalid Banner ID format for delete'));
    try {
        const result = await deleteBannerById(pool, bannerId);
         res.status(200).json({ status: 'success', message: result.message });
    } catch (error) {
        return next(error);
    }
};