// src/controllers/gallery.controller.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import pool from '../config/db';
import {
    getAllGalleryItems,
    getGalleryItemById,
    createGalleryItem,
    updateGalleryItemById,
    deleteGalleryItemById
} from '../services/gallery.service';
import { GetAllGalleryItemsQuery, GetGalleryItemParams, CreateGalleryItemInput, UpdateGalleryItemInput, UpdateGalleryItemSchema } from '../schemas/gallery.schema';
import NotFoundError from '../errors/notFoundError';

export const getAllGalleryItemsHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const queryParams = req.query as GetAllGalleryItemsQuery;
    try {
        const items = await getAllGalleryItems(pool, queryParams);
         res.status(200).json({ status: 'success', results: items.length, data: { items } });
    } catch (error) {
        return next(error);
    }
};

export const getGalleryItemByIdHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const itemId = parseInt(req.params.itemId as string, 10);
     if (isNaN(itemId) || itemId <=0) return next(new NotFoundError('Invalid Gallery Item ID format'));
    try {
        const item = await getGalleryItemById(pool, itemId);
        if (!item) {
            return next(new NotFoundError('Gallery item not found'));
        }
         res.status(200).json({ status: 'success', data: { item } });
    } catch (error) {
        return next(error);
    }
};

// --- Admin Handlers ---
export const createGalleryItemHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const bodyData = req.body as CreateGalleryItemInput;
    try {
        const newItem = await createGalleryItem(pool, bodyData);
         res.status(201).json({ status: 'success', data: { item: newItem } });
    } catch (error) {
        return next(error);
    }
};

export const updateGalleryItemHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const itemId = parseInt(req.params.itemId as string, 10);
    const bodyData = req.body as UpdateGalleryItemInput;
     if (isNaN(itemId) || itemId <=0) return next(new NotFoundError('Invalid Gallery Item ID format for update'));
    try {
        const updatedItem = await updateGalleryItemById(pool, itemId, bodyData);
         res.status(200).json({ status: 'success', data: { item: updatedItem } });
    } catch (error) {
        return next(error);
    }
};

export const deleteGalleryItemHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const itemId = parseInt(req.params.itemId as string, 10);
     if (isNaN(itemId) || itemId <=0) return next(new NotFoundError('Invalid Gallery Item ID format for delete'));
    try {
        const result = await deleteGalleryItemById(pool, itemId);
         res.status(200).json({ status: 'success', message: result.message });
    } catch (error) {
        return next(error);
    }
};