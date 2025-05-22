// src/controllers/booking.controller.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import pool from '../config/db';
import {
    createBooking,
    getUserBookings,
    getBookingById,
    updateBookingById,
    cancelBookingByUser
} from '../services/booking.service';
import { CreateBookingInput, GetAllBookingsQuery, UpdateBookingInput, UpdateBookingSchema, GetBookingParams } from '../schemas/booking.schema';
import NotFoundError from '../errors/notFoundError';
import logger from '../utils/logger';

export const createBookingHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) return next(new Error('User ID not found (authentication error)'));
    const bodyData = req.body as CreateBookingInput;
    try {
        const newBooking = await createBooking(pool, userId, bodyData);
         res.status(201).json({ status: 'success', data: { booking: newBooking } });
    } catch (error) {
        return next(error);
    }
};

export const getMyBookingsHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) return next(new Error('User ID not found (authentication error)'));
    const queryParams = req.query as GetAllBookingsQuery;
    try {
        const bookings = await getUserBookings(pool, userId, queryParams);
         res.status(200).json({ status: 'success', results: bookings.length, data: { bookings } });
    } catch (error) {
        return next(error);
    }
};

export const getMyBookingByIdHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const userId = req.user?.userId;
    const bookingId = parseInt(req.params.bookingId as string, 10);
    if (!userId) return next(new Error('User ID not found (authentication error)'));
    if (isNaN(bookingId) || bookingId <=0) return next(new NotFoundError('Invalid Booking ID format'));

    try {
        const booking = await getBookingById(pool, userId, bookingId);
        if (!booking) {
            return next(new NotFoundError('Booking not found or does not belong to this user.'));
        }
         res.status(200).json({ status: 'success', data: { booking } });
    } catch (error) {
        return next(error);
    }
};

export const updateMyBookingHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const userId = req.user?.userId;
    const bookingId = parseInt(req.params.bookingId as string, 10);
    const bodyData = req.body as UpdateBookingInput;
    if (!userId) return next(new Error('User ID not found (authentication error)'));
    if (isNaN(bookingId) || bookingId <=0) return next(new NotFoundError('Invalid Booking ID format for update'));

    try {
        const updatedBooking = await updateBookingById(pool, userId, bookingId, bodyData);
         res.status(200).json({ status: 'success', data: { booking: updatedBooking } });
    } catch (error) {
        return next(error);
    }
};

export const cancelMyBookingHandler: RequestHandler = async (req, res, next): Promise<void> => {
    const userId = req.user?.userId;
    const bookingId = parseInt(req.params.bookingId as string, 10);
    if (!userId) return next(new Error('User ID not found (authentication error)'));
    if (isNaN(bookingId) || bookingId <=0) return next(new NotFoundError('Invalid Booking ID format for cancellation'));

    try {
        const cancelledBooking = await cancelBookingByUser(pool, userId, bookingId);
         res.status(200).json({ status: 'success', data: { booking: cancelledBooking } });
    } catch (error) {
        return next(error);
    }
};