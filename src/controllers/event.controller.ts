// src/controllers/event.controller.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import pool from '../config/db';
import {
    getAllEvents,
    createEvent,
    getEventById,
    updateEventById,
    deleteEventById
} from '../services/event.service';
import { GetAllEventsQuery, CreateEventInput, UpdateEventInput, UpdateEventSchema, UpdateEventParams } from '../schemas/event.schema';
import NotFoundError from '../errors/notFoundError';

export const getAllEventsHandler: RequestHandler = async (req, res, next) => {
    const queryParams = req.query as GetAllEventsQuery;
    try {
        const events = await getAllEvents(pool, queryParams);
         res.status(200).json({ status: 'success', results: events.length, data: { events } });
    } catch (error) { return next(error); }
};

// --- Admin Handlers ---
export const createEventHandler: RequestHandler = async (req, res, next) => {
    const bodyData = req.body as CreateEventInput;
    try {
        const newEvent = await createEvent(pool, bodyData);
         res.status(201).json({ status: 'success', data: { event: newEvent } });
    } catch (error) { return next(error); }
};

export const getEventByIdHandler: RequestHandler = async (req, res, next) => {
    const eventId = parseInt(req.params.eventId as string, 10);
    if (isNaN(eventId) || eventId <=0) return next(new NotFoundError('Invalid Event ID format'));
    try {
        const event = await getEventById(pool, eventId);
        if (!event) return next(new NotFoundError('Event not found'));
         res.status(200).json({ status: 'success', data: { event } });
    } catch (error) { return next(error); }
};

export const updateEventHandler: RequestHandler = async (req, res, next) => {
    const eventId = parseInt(req.params.eventId as string, 10);
    const bodyData = req.body as UpdateEventInput;
    if (isNaN(eventId) || eventId <=0) return next(new NotFoundError('Invalid Event ID format for update'));
    try {
        const updatedEvent = await updateEventById(pool, eventId, bodyData);
         res.status(200).json({ status: 'success', data: { event: updatedEvent } });
    } catch (error) { return next(error); }
};

export const deleteEventHandler: RequestHandler = async (req, res, next) => {
    const eventId = parseInt(req.params.eventId as string, 10);
    if (isNaN(eventId) || eventId <=0) return next(new NotFoundError('Invalid Event ID format for delete'));
    try {
        const result = await deleteEventById(pool, eventId);
         res.status(200).json({ status: 'success', message: result.message });
    } catch (error) { return next(error); }
};