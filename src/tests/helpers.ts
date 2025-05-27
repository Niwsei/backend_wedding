// src/tests/helpers.ts
import request from 'supertest';
import app from '../app'; // Import Express app instance
import { LoginInput } from '../schemas/auth.schema'; // Import LoginInput type

interface LoginResponse {
    token: string;
    user: {
        userId: number;
        email?: string | null;
        phoneNumber?: string | null;
        fullName?: string | null;
        username?: string | null;
        role?: string;
    };
}

/**
 * Helper function to log in a user and return the JWT token.
 * @param credentials - Login credentials (identifier and password).
 * @returns The JWT token if login is successful.
 * @throws Error if login fails.
 */
export const loginUserAndGetToken = async (credentials: LoginInput): Promise<string> => {
    const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

    if (response.statusCode !== 200 || !response.body.data || !response.body.data.token) {
        console.error('Login failed in helper:', response.body);
        throw new Error(`Login failed for ${credentials.identifier}: ${response.body.message || response.statusCode}`);
    }
    return response.body.data.token;
};

/**
 * Logs in as a predefined admin user.
 * Ensure this admin user exists in your test database.
 * @returns Admin JWT token.
 */
export const loginAsAdmin = async (): Promise<string> => {
    // --- สำคัญ: แก้ไข Email/Password ของ Admin ให้ตรงกับข้อมูลใน Test Database ของคุณ ---
    const adminCredentials: LoginInput = {
        identifier: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
        password: process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123',
    };
    return loginUserAndGetToken(adminCredentials);
};

/**
 * Logs in as a predefined regular user.
 * Ensure this regular user exists in your test database.
 * @returns Regular user JWT token.
 */
export const loginAsRegularUser = async (): Promise<string> => {
    // --- สำคัญ: แก้ไข Email/Password ของ User ปกติ ให้ตรงกับข้อมูลใน Test Database ของคุณ ---
    const userCredentials: LoginInput = {
        identifier: process.env.TEST_USER_EMAIL || 'user@example.com',
        password: process.env.TEST_USER_PASSWORD || 'UserPassword123',
    };
    return loginUserAndGetToken(userCredentials);
};