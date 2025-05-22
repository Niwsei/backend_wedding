// src/middleware/authorizeRoles.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import ApiError from '../errors/apiError'; // หรือสร้าง ForbiddenError โดยเฉพาะ

// Custom Error สำหรับ Forbidden Access
class ForbiddenError extends ApiError {
    constructor(message = 'You do not have permission to perform this action.') {
        super(403, message, true); // 403 Forbidden
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}

/**
 * Middleware to authorize users based on their roles.
 * @param allowedRoles Array of roles that are allowed to access the route.
 */
export const authorizeRoles = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.user?.role; // ดึง role จาก req.user ที่ authenticate middleware ใส่ไว้

        if (!req.user || !userRole) {
            // This should ideally be caught by the authenticate middleware first
            logger.warn('Authorization failed: User or role not found in request. Authentication might be missing or failed.');
            return next(new ForbiddenError('User not authenticated or role not determined.'));
        }

        if (allowedRoles.includes(userRole)) {
            logger.debug({ userId: req.user.userId, role: userRole, allowedRoles }, 'User authorized for role.');
            next(); // User's role is in the allowed list, proceed
        } else {
            logger.warn({ userId: req.user.userId, role: userRole, allowedRoles }, 'Authorization failed: User role not permitted.');
            return next(new ForbiddenError()); // User's role is not allowed
        }
    };
};