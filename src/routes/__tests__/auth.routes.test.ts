// src/routes/__tests__/auth.routes.test.ts
import request from 'supertest';
import app from '../../app';
import prisma, { disconnectPrisma } from '../../config/prisma'; // <-- Import prisma และ disconnectPrisma
import { loginUserAndGetToken, loginAsAdmin, loginAsRegularUser } from '../../tests/helpers'; // Helper เดิม
import { createTestUserWithPrisma, cleanupUserByEmailWithPrisma, cleanupAllTestDataWithPrisma } from '../../tests/prisma.helpers'; // Prisma helpers
import config from '../../config'; // Import config สำหรับ TEST_ADMIN_EMAIL etc.
import { UserRole } from '@prisma/client';

// --- ตัวแปรสำหรับ Test Users ---
const adminEmail = config.TEST_ADMIN_EMAIL || 'admin-test@example.com';
const adminPassword = config.TEST_ADMIN_PASSWORD || 'AdminPass123!';
const regularUserEmail = config.TEST_USER_EMAIL || 'user-test@example.com';
const regularUserPassword = config.TEST_USER_PASSWORD || 'UserPass123!';


describe('Auth Routes - /api/auth', () => {
    // Setup test users before all tests in this suite
    beforeAll(async () => {
        // Clean up potential old data first
        await cleanupUserByEmailWithPrisma(adminEmail);
        await cleanupUserByEmailWithPrisma(regularUserEmail);

        // Create test users
        await createTestUserWithPrisma({
            email: adminEmail,
            password: adminPassword,
            fullName: 'Admin Test User',
            username: `admin${Date.now()}`,
            role: UserRole.admin, // ใช้ Enum จาก Prisma
        });
        await createTestUserWithPrisma({
            email: regularUserEmail,
            password: regularUserPassword,
            fullName: 'Regular Test User',
            username: `user${Date.now()}`,
            role: UserRole.client,
        });
    });

    // Disconnect Prisma and close other connections after all tests in this file
    afterAll(async () => {
        // Clean up users created in this test suite
        await cleanupUserByEmailWithPrisma(adminEmail);
        await cleanupUserByEmailWithPrisma(regularUserEmail);

        // await cleanupAllTestDataWithPrisma(); // Optional: ถ้าต้องการล้างข้อมูลทั้งหมด
        await disconnectPrisma(); // <-- ปิด Prisma Client
        // await closeRedisConnection(); // ถ้ามีการใช้ Redis ใน Test นี้
        // await closeDbPool(); // ไม่จำเป็นแล้วถ้าไม่ได้ใช้ mysql2 pool โดยตรง
    });

    describe('POST /register', () => {
        const baseEmail = `test-register-${Date.now()}`;

        it('should register a new user successfully with valid data', async () => {
            const registerData = {
                email: `${baseEmail}-success@example.com`,
                password: 'password123',
                fullName: 'Test Register User',
                username: `testreg${Date.now()}`
            };
            const response = await request(app)
                .post('/api/auth/register')
                .send(registerData);

            expect(response.statusCode).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.email).toBe(registerData.email);

            // Clean up user created by this test
            await cleanupUserByEmailWithPrisma(registerData.email);
        });

        it('should return 409 if email already exists', async () => {
            const existingUserEmail = `${baseEmail}-exist@example.com`;
            // 1. Create user first
            await createTestUserWithPrisma({ email: existingUserEmail, password: 'password123' });

            // 2. Try to register with the same email
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: existingUserEmail, password: 'anotherPassword' });

            expect(response.statusCode).toBe(409);
            expect(response.body.message).toBe('Email address is already registered.');

            // Clean up
            await cleanupUserByEmailWithPrisma(existingUserEmail);
        });
        // ... other registration tests (invalid email, short password, etc.)
    });

    describe('POST /login', () => {
        it('should login an existing admin user with correct credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: adminEmail,
                    password: adminPassword,
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.email).toBe(adminEmail);
            expect(response.body.data.user.role).toBe(UserRole.admin);
        });

         it('should login an existing regular user with correct credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: regularUserEmail,
                    password: regularUserPassword,
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.data.user.role).toBe(UserRole.client);
        });

        it('should return 401 for non-existent identifier during login', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: 'nonexistent@example.com',
                    password: 'somepassword',
                });
            expect(response.statusCode).toBe(401);
            expect(response.body.message).toBe('Invalid credentials.');
        });
        // ... other login tests (incorrect password, missing fields) ...
    });
});