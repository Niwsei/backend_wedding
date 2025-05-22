// src/controllers/testimonial.controller.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import pool from '../config/db';
import {
    getAllTestimonials,
    createTestimonial,
    getTestimonialById,
    updateTestimonialById,
    deleteTestimonialById
} from '../services/testimonial.service';
import { GetAllTestimonialsQuery, CreateTestimonialInput, UpdateTestimonialInput, UpdateTestimonialSchema, UpdateTestimonialParams } from '../schemas/testimonial.schema';
import NotFoundError from '../errors/notFoundError';

export const getAllTestimonialsHandler: RequestHandler = async (req, res, next) => {
    const queryParams = req.query as GetAllTestimonialsQuery;
    try {
        const testimonials = await getAllTestimonials(pool, queryParams);
         res.status(200).json({ status: 'success', results: testimonials.length, data: { testimonials } });
    } catch (error) {
        return next(error);
    }
};

// --- Admin Handlers ---
export const createTestimonialHandler: RequestHandler = async (req, res, next) => {
    const bodyData = req.body as CreateTestimonialInput;
    try {
        const newTestimonial = await createTestimonial(pool, bodyData);
         res.status(201).json({ status: 'success', data: { testimonial: newTestimonial } });
    } catch (error) {
        return next(error);
    }
};

export const getTestimonialByIdHandler: RequestHandler = async (req, res, next) => {
    const testimonialId = parseInt(req.params.testimonialId as string, 10);
    if (isNaN(testimonialId) || testimonialId <=0) return next(new NotFoundError('Invalid Testimonial ID format'));
    try {
        const testimonial = await getTestimonialById(pool, testimonialId);
        if (!testimonial) {
            return next(new NotFoundError('Testimonial not found'));
        }
         res.status(200).json({ status: 'success', data: { testimonial } });
    } catch (error) {
        return next(error);
    }
};

export const updateTestimonialHandler: RequestHandler = async (req, res, next) => {
    const testimonialId = parseInt(req.params.testimonialId as string, 10);
    const bodyData = req.body as UpdateTestimonialInput;
    if (isNaN(testimonialId) || testimonialId <=0) return next(new NotFoundError('Invalid Testimonial ID format for update'));
    try {
        const updatedTestimonial = await updateTestimonialById(pool, testimonialId, bodyData);
         res.status(200).json({ status: 'success', data: { testimonial: updatedTestimonial } });
    } catch (error) {
        return next(error);
    }
};

export const deleteTestimonialHandler: RequestHandler = async (req, res, next) => {
    const testimonialId = parseInt(req.params.testimonialId as string, 10);
    if (isNaN(testimonialId) || testimonialId <=0) return next(new NotFoundError('Invalid Testimonial ID format for delete'));
    try {
        const result = await deleteTestimonialById(pool, testimonialId);
         res.status(200).json({ status: 'success', message: result.message });
    } catch (error) {
        return next(error);
    }
};