// src/controllers/offer.controller.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import pool from '../config/db';
import {
    getAllOffers,
    createOffer,
    getOfferById,
    updateOfferById,
    deleteOfferById
} from '../services/offer.service';
import { GetAllOffersQuery, CreateOfferInput, UpdateOfferInput, UpdateOfferSchema, UpdateOfferParams } from '../schemas/offer.schema';
import NotFoundError from '../errors/notFoundError';

export const getAllOffersHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const queryParams = req.query as GetAllOffersQuery;
    try {
        const offers = await getAllOffers(pool, queryParams);
         res.status(200).json({ status: 'success', results: offers.length, data: { offers } });
    } catch (error) {
        return next(error);
    }
};

// --- Admin Handlers ---
export const createOfferHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const bodyData = req.body as CreateOfferInput;
    try {
        const newOffer = await createOffer(pool, bodyData);
         res.status(201).json({ status: 'success', data: { offer: newOffer } });
    } catch (error) {
        return next(error);
    }
};

export const getOfferByIdHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const offerId = parseInt(req.params.offerId as string, 10);
    if (isNaN(offerId) || offerId <=0) return next(new NotFoundError('Invalid Offer ID format'));
    try {
        const offer = await getOfferById(pool, offerId);
        if (!offer) {
            return next(new NotFoundError('Special offer not found'));
        }
         res.status(200).json({ status: 'success', data: { offer } });
    } catch (error) {
        return next(error);
    }
};

export const updateOfferHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const offerId = parseInt(req.params.offerId as string, 10);
    const bodyData = req.body as UpdateOfferInput;
    if (isNaN(offerId) || offerId <=0) return next(new NotFoundError('Invalid Offer ID format for update'));
    try {
        const updatedOffer = await updateOfferById(pool, offerId, bodyData);
         res.status(200).json({ status: 'success', data: { offer: updatedOffer } });
    } catch (error) {
        return next(error);
    }
};

export const deleteOfferHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const offerId = parseInt(req.params.offerId as string, 10);
    if (isNaN(offerId) || offerId <=0) return next(new NotFoundError('Invalid Offer ID format for delete'));
    try {
        const result = await deleteOfferById(pool, offerId);
         res.status(200).json({ status: 'success', message: result.message });
    } catch (error) {
        return next(error);
    }
};