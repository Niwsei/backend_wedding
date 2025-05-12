import express from 'express';
import authRouter from './auth.routes';
import logger from '../utils/logger';
import userRouter from './user.routes'; // Example import for user routes
// import other routers...

const router = express.Router();

router.use('/auth', (req, res, next) => {
    logger.debug(`Routing to /auth for path: ${req.path}`);
    next();
} , authRouter);
router.use('/users', userRouter); // <-- Mount user router ที่ /api/users
// router.use('/users', authenticate, userRouter); // Example with authentication middleware
// router.use('/services', serviceRouter);
// ...

router.get('/healthcheck', (req, res) => {res.status(200).json({ status: 'ok' })}); // JSON response is better

export default router;