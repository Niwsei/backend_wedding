// src/routes/__tests__/auth.routes.test.ts
import request from 'supertest';
import app from '../../app'; // Import Express app instance
import pool from '../../config/db'; // Import DB pool for potential cleanup/setup
import { hashPassword } from '../../utils/password'; // For setup if needed
import redisClient, { closeRedisConnection } from '../../config/redis';
import { ResultSetHeader } from 'mysql2';

// --- Helper function to clean up user after test (ตัวอย่าง) ---
// ในแอปจริง ควรมีวิธีที่ดีกว่านี้ เช่น ใช้ Transaction หรือ Test Database แยก
const cleanupUserByEmail = async (email: string) => {
    try {
        await pool.query('DELETE FROM Users WHERE email = ?', [email]);
        // await redisClient.del(`otp_email:${email}`); 
    } catch (error) {
        console.error('Error cleaning up user:', error);
    }
};

describe('Auth Routes - /api/auth', () => {
    // Clean up database connection pool after all tests in this file are done
    afterAll(async () => {
        await closeRedisConnection(); // ปิด Redis connection
        await pool.end(); // ปิด DB pool เพื่อให้ Jest ออกได้สมบูรณ์
    });

     describe('POST /register', () => {
        const baseEmail = `testuser-${Date.now()}`; // สร้าง base email ที่ไม่ซ้ำ

        // --- Test Case 1: Successful Registration ---
        const successfulRegisterEmail = `${baseEmail}-success@example.com`;
        afterEach(async () => { await cleanupUserByEmail(successfulRegisterEmail); }); // Clean up หลัง test นี้

        it('should register a new user successfully with valid data', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: successfulRegisterEmail,
                    password: 'password123',
                    fullName: 'Test Success User',
                    username: `testsuccess${Date.now()}`
                });
            expect(response.statusCode).toBe(201);
            // ... (expectations อื่นๆ) ...
        });

        // --- Test Case 2: Invalid Email Format ---
        it('should return 400 for invalid email format during registration', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: 'invalid-email', password: 'password123' });
            expect(response.statusCode).toBe(400);
            // ... (expectations อื่นๆ) ...
        });

        // --- Test Case 3: Email Already Exists ---
        const existingEmail = `${baseEmail}-exist@example.com`;
        // Setup: สร้าง user นี้ก่อน
        beforeEach(async () => {
            await request(app)
                .post('/api/auth/register')
                .send({ email: existingEmail, password: 'password123', fullName: 'Existing User' });
        });
        afterEach(async () => { await cleanupUserByEmail(existingEmail); }); // Clean up หลัง test นี้

        it('should return 409 if email already exists', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: existingEmail, password: 'anotherPassword' }); // พยายามสมัครซ้ำ

            expect(response.statusCode).toBe(409); // คาดหวัง 409 Conflict
            expect(response.body.status).toBe('error'); // หรือ 'fail' ตามที่คุณตั้งค่า
            expect(response.body.message).toBe('Email address is already registered.');
        });
    });

   describe('POST /login', () => {
        const loginUserEmail = `login-${Date.now()}@example.com`;
        const loginPassword = 'loginPassword123';
        const loginUsername = `loginuser${Date.now()}`; // สร้าง username แยก
    let createdUserId: number;

        beforeAll(async () => { // สร้าง user สำหรับ login เพียงครั้งเดียวสำหรับ describe block นี้
            const {hash: hashedPassword} = await hashPassword(loginPassword);
            const [result] = await pool.query<ResultSetHeader>( // ใช้ OkPacket เพื่อให้ Type ถูกต้องสำหรับ insertId
                'INSERT INTO Users (email, password_hash, full_name, username, user_role) VALUES (?, ?, ?, ?, ?)',
                [loginUserEmail, hashedPassword, 'Login Test User', loginUsername, 'client'] // เพิ่ม loginUsername และ user_role
            );
            createdUserId = result.insertId; // แก้การเข้าถึง insertId
        });

        afterAll(async () => { // ลบ user ที่สร้างสำหรับ login หลัง test ทั้งหมดใน describe block นี้จบ
            if(createdUserId) {
                 await cleanupUserByEmail(loginUserEmail);
            }
           
        });

        it('should login an existing user with correct credentials and return a token', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: loginUserEmail,
                    password: loginPassword,
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.token).toBeDefined();
            expect(typeof response.body.data.token).toBe('string');
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.email).toBe(loginUserEmail);
        });

        it('should return 401 for non-existent email during login', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'somepassword',
                });
            expect(response.statusCode).toBe(401);
            expect(response.body.message)
        });

        it('should return 401 for incorrect password during login', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: loginUserEmail,
                    password: 'wrongPassword',
                });
            expect(response.statusCode).toBe(401);
            expect(response.body.message)
        });

        it('should return 400 for missing password during login', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: loginUserEmail,
                    // password missing
                });
            expect(response.statusCode).toBe(400);
            // ... (ตรวจสอบ error message ที่ถูกต้องจาก Zod)
        });
    });
});