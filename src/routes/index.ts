import express from 'express';
import { generalRateLimiter } from '../middleware/rateLimiter';


import authRouter from './auth.routes';
import logger from '../utils/logger';
import userRouter from './user.routes'; // Example import for user routes
import taskRouter from './task.routes';
import budgetRouter from './budget.routes';
import inspirationRouter from './inspiration.routes';
import ServiceRouter from './service.routes';
import PackageRouter from './package.routes';
import GalleryRouter from './gallery.routes';
import BookingRouter from './booking.routes';
import bannerRouter from './banner.routes';
import offerRouter from './offer.routes';
import testimonialRouter from './testimonial.routes';
import eventRouter from './event.routes';
// import other routers...

const router = express.Router();

router.use(generalRateLimiter); // Apply rate limiting middleware globally

router.use('/auth', (req, res, next) => {
    logger.debug(`Routing to /auth for path: ${req.path}`);
    next();
} , authRouter);

// router.use('/users', authenticate, userRouter); // Example with authentication middleware
// ...

router.get('/healthcheck', (req, res) => {res.status(200).json({ status: 'ok' })}); // JSON response is better

router.use('/users', userRouter); // <-- Mount user router ที่ /api/users
router.use('/tasks', taskRouter);
router.use('/budget', budgetRouter); // <-- Mount Budget Router ที่ /api/budget
router.use('/inspirations', inspirationRouter);
router.use('/services',ServiceRouter );
router.use('/packages', PackageRouter);
router.use('/gallery', GalleryRouter);
router.use('/bookings', BookingRouter); // <-- Mount Booking Router ที่ /api/bookings
router.use('/banners', bannerRouter); 
router.use('/offers', offerRouter); 
router.use('/testimonials', testimonialRouter);
router.use('/events', eventRouter);


export default router;