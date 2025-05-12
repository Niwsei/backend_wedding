import express from 'express';
import { registerHandler, loginHandler, requestOtpHandler, verifyOtpHandler } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { SignupSchema, LoginSchema } from '../schemas/auth.schema';
import { RequestOtpSchema, VerifyOtpSchema } from '../schemas/otp.schema';
import { otpRateLimiter } from '../middleware/rateLimiter'; // <-- Import rate limiter middleware
import logger from '../utils/logger';

const router = express.Router();

// --- Email/Password Routes ---
router.post('/register',(req, res, next) => { // <--- เพิ่ม log ก่อน middleware/handler
    logger.debug(`Handling POST /register request`);
    next(); // อย่าลืม next()
},  validateRequest({ body: SignupSchema.shape.body }), registerHandler);
router.post('/login', validateRequest({ body: LoginSchema.shape.body }), loginHandler);

// --- Phone OTP Routes ---
router.post('/otp/request', validateRequest({ body: RequestOtpSchema.shape.body }), otpRateLimiter, requestOtpHandler);
router.post('/otp/verify', validateRequest({ body: VerifyOtpSchema.shape.body }), verifyOtpHandler);

export default router;