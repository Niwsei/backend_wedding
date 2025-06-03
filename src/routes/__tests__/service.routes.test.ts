// src/routes/__tests__/service.routes.test.ts
import request from 'supertest';
import app from '../../app';
import prisma, { disconnectPrisma } from '../../config/prisma'; // Import Prisma
import { loginAsAdmin, loginAsRegularUser,loginUserAndGetToken } from '../../tests/helpers';
import { createTestUserWithPrisma, cleanupUserByEmailWithPrisma } from '../../tests/prisma.helpers'; // Import Prisma helpers
import config from '../../config';
import { UserRole } from '@prisma/client';
import logger from '../../utils/logger'; // Import logger

// --- Credentials for test users ---
const adminEmailForServiceTest = config.TEST_ADMIN_EMAIL || 'admin-service-test@example.com';
const adminPasswordForServiceTest = config.TEST_ADMIN_PASSWORD || 'AdminSvcPass123!';
const regularUserEmailForServiceTest = config.TEST_USER_EMAIL || 'user-service-test@example.com';
const regularUserPasswordForServiceTest = config.TEST_USER_PASSWORD || 'UserSvcPass123!';


describe('/api/services', () => {
    let adminToken: string;
    let regularUserToken: string;
    let createdServiceId: number | null = null; // Initialize with null

    beforeAll(async () => {
        logger.info('Setting up users for /api/services tests...');
        // Clean up potential old test users
        await cleanupUserByEmailWithPrisma(adminEmailForServiceTest);
        await cleanupUserByEmailWithPrisma(regularUserEmailForServiceTest);

        // Create admin user for these tests
        await createTestUserWithPrisma({
            email: adminEmailForServiceTest,
            password: adminPasswordForServiceTest,
            fullName: 'Admin Service Tester',
            role: UserRole.admin,
        });

        // Create regular user for these tests
        await createTestUserWithPrisma({
            email: regularUserEmailForServiceTest,
            password: regularUserPasswordForServiceTest,
            fullName: 'Regular Service Tester',
            role: UserRole.client,
        });

        // Login to get tokens
        try {
            adminToken = await loginUserAndGetToken({ identifier: adminEmailForServiceTest, password: adminPasswordForServiceTest });
            regularUserToken = await loginUserAndGetToken({ identifier: regularUserEmailForServiceTest, password: regularUserPasswordForServiceTest });
            logger.info('Test users logged in successfully for /api/services tests.');
        } catch (error) {
            logger.error("Failed to login test users in beforeAll (service.routes.test.ts):", error);
            throw error; // Fail fast if login setup fails
        }
    });

    afterAll(async () => {
        logger.info('Cleaning up users for /api/services tests...');
        // Clean up users created for these tests
        await cleanupUserByEmailWithPrisma(adminEmailForServiceTest);
        await cleanupUserByEmailWithPrisma(regularUserEmailForServiceTest);

        await disconnectPrisma(); // <-- **สำคัญ: ปิด Prisma Client**
        // await closeRedisConnection(); // ถ้ามีการใช้ Redis
    });

    describe('GET /', () => {
        it('should return a list of active services', async () => {
            const res = await request(app).get('/api/services');
            expect(res.statusCode).toBe(200);
            // ... (more assertions)
        });
    });

    describe('POST / (Admin Only)', () => {
        afterEach(async () => { // Clean up created service
            if (createdServiceId) {
                // ใช้ Prisma หรือ Raw SQL ก็ได้ แต่ Prisma จะ Type Safe กว่า
                try {
                    await prisma.serviceFeature.deleteMany({ where: { service_id: createdServiceId }});
                    await prisma.service.delete({ where: { service_id: createdServiceId } });
                    logger.debug(`Cleaned up service ID: ${createdServiceId}`);
                    createdServiceId = null; // Reset
                } catch (error) {
                     logger.error({error, serviceId: createdServiceId}, "Error cleaning up service in afterEach");
                }
            }
        });

        it('should create a new service with admin token', async () => {
            const newServiceData = { name: `Test Service ${Date.now()}`, description: 'Desc', basePrice: 100, features: ["Feat1"], isActive: true };
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newServiceData);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.service.name).toBe(newServiceData.name);
            if(res.body.data.service && res.body.data.service.service_id) {
                createdServiceId = res.body.data.service.service_id;
            }
        });

        it('should return 403 if non-admin tries to create a service', async () => {
            const newServiceData = { name: 'Forbidden Service', basePrice: 50 };
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${regularUserToken}`)
                .send(newServiceData);
            expect(res.statusCode).toBe(403);
        });
    });
    // ... (describe blocks for GET /:id, PUT /:id, DELETE /:id ...)
});

