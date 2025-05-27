// src/routes/__tests__/service.routes.test.ts
import request from 'supertest';
import app from '../../app';
import { closeDbPool } from '../../config/db'; // ถ้ายังใช้ mysql2 pool โดยตรง
// import { disconnectPrisma } from '../../config/prisma'; // ถ้าจะใช้ Prisma
import { loginAsAdmin, loginAsRegularUser } from '../../tests/helpers'; // <-- Import helpers
import pool from '../../config/db';



describe('/api/services', () => {
    let adminToken: string;
    let regularUserToken: string;
    let createdServiceId: number ;

    beforeAll(async () => {
        try {
            adminToken = await loginAsAdmin();
            regularUserToken = await loginAsRegularUser();
        } catch (error) {
            console.error("Failed to login test users in beforeAll:", error);
            // อาจจะ throw error เพื่อให้ test suite fail ไปเลยถ้า login ไม่ได้
            throw error;
        }
        // ... (Optional: Seed initial services) ...
    });

    afterAll(async () => {
        await closeDbPool();
    });

    describe('GET /', () => {
        it('should return a list of active services', async () => {
            const res = await request(app).get('/api/services');
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.data.services)).toBe(true);
            // Add more assertions on the structure and content
        });
        // ... more GET tests with filters ...
    });

    describe('POST / (Admin Only)', () => {
        afterEach(async () => { // Clean up created service
            if (createdServiceId) {
                await pool.query('DELETE FROM ServiceFeatures WHERE service_id = ?', [createdServiceId]);
                await pool.query('DELETE FROM Services WHERE service_id = ?', [createdServiceId]);
            }
        });

        it('should create a new service with admin token', async () => {
            const newServiceData = { name: 'Test Service', description: 'Desc', basePrice: 100, features: ["Feat1"] };
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`) // สมมติว่า adminToken มีค่าแล้ว
                .send(newServiceData);
            expect(res.statusCode).toBe(201);
            expect(res.body.data.service.name).toBe(newServiceData.name);
            createdServiceId = res.body.data.service.service_id; // เก็บ ID ไว้ลบ
        });

        it('should return 403 if non-admin tries to create a service', async () => {
            const newServiceData = { name: 'Forbidden Service', basePrice: 50 };
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${regularUserToken}`)
                .send(newServiceData);
            expect(res.statusCode).toBe(403);
        });
        // ... more POST tests (validation errors, etc.) ...
    });

    // ... describe blocks for GET /:id, PUT /:id, DELETE /:id ...
});