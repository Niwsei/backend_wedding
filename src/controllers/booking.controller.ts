import { Request, Response, NextFunction } from "express";
import pool from "../config/db";
import { ZodError, ZodSchema } from "zod";



export const getBookingHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await pool.execute("SELECT * FROM bookings")

    } catch (error) {
        
    }
}