import express from 'express';
import { registerHandler, loginHandler } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { SignupSchema, LoginSchema } from '../schemas/auth.schema';
import { RequestOtpSchema, VerifyOtpSchema } from '../schemas/otp.schema';
import { sensitiveActionRateLimiter, otpRequestRateLimiter } from '../middleware/rateLimiter'; // <-- Import rate limiter middleware
import logger from '../utils/logger';

const router = express.Router();

// --- Email/Password Routes ---
/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Creates a new user account using email and password or other required fields.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupInput'
 *     responses:
 *       201:
 *         description: User registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: "string", example: "success" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Validation failed (e.g., invalid email, short password).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflict (e.g., email or username already exists).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.post('/register',(req, res, next) => { logger.debug(`Handling POST /register request`);  next();}, sensitiveActionRateLimiter,  validateRequest({ body: SignupSchema.shape.body }), registerHandler);


/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login an existing user
 *     description: Authenticates a user with their email and password, returning a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: "string", example: "success" }
 *                 data:
 *                   $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation failed (e.g., missing fields).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized (e.g., invalid email or password).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', sensitiveActionRateLimiter, validateRequest({ body: LoginSchema.shape.body }), loginHandler);

export default router;