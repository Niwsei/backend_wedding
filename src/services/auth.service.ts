// ນຳເຂົ້າ types `Pool` (ສຳລັບ connection pool), `RowDataPacket` (type ພື້ນຖານສຳລັບຂໍ້ມູນທີ່ໄດ້ຈາກ query),
// ແລະ `ResultSetHeader` (type ສຳລັບຜົນລັບຈາກຄຳສັ່ງ INSERT/UPDATE/DELETE) ຈາກ library 'mysql2/promise'.
import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import prisma from '../config/prisma';
import { Prisma, User, UserRole } from '@prisma/client';

// ນຳເຂົ້າ default export (`redisClient`) ແລະ named export (`closeRedisConnection`) ຈາກ file `redis` ໃນ `config`.
// `closeRedisConnection` ອາດຈະບໍ່ໄດ້ຖືກໃຊ້ໂດຍກົງໃນ file ນີ້ (ຕາມ comment).
import redisClient, { closeRedisConnection } from '../config/redis'; // Note: closeRedisConnection is likely unused here


// ນຳເຂົ້າ functions `hashPassword` (ສຳລັບສ້າງ hash ຈາກລະຫັດຜ່ານ) ແລະ `comparePassword` (ສຳລັບປຽບທຽບລະຫັດຜ່ານກັບ hash)
// ຈາກ file `password` ໃນ folder `utils`.
import { hashPassword, comparePassword } from '../utils/password';

// ນຳເຂົ້າ types `SignupInput` ແລະ `LoginInput` ຈາກ file `auth.schema.ts`.
// ເຫຼົ່ານີ້ແມ່ນ types ທີ່ໄດ້ຈາກ Zod schemas ສຳລັບ input ການລົງທະບຽນ ແລະ login.
import { SignupInput, LoginInput } from '../schemas/auth.schema';

// ນຳເຂົ້າ default export (object `jwt`) ຈາກ library 'jsonwebtoken' ສຳລັບເຮັດວຽກກັບ JWT.
import jwt from 'jsonwebtoken';

// ນຳເຂົ້າ default export (object `config`) ຈາກ file `config` ເພື່ອເອົາຄ່າຕັ້ງຄ່າເຊັ່ນ JWT_SECRET.
import config from '../config';

// ນຳເຂົ້າ custom error classes: BadRequestError (400), UnauthorizedError (401).
import BadRequestError from '../errors/badRequestError';
import UnauthorizedError from '../errors/unauthorizedError';
// import NotFoundError from '../errors/notFoundError'; // Comment ໄວ້, ອາດຈະຕ້ອງການໃນພາຍຫຼັງ.
// ນຳເຂົ້າ custom error class `ApiError` ທີ່ເປັນພື້ນຖານສຳລັບ operational/non-operational errors.
import ApiError from '../errors/apiError';

// ນຳເຂົ້າ `logger` ຈາກ file `logger` ໃນ `utils` ເພື່ອບັນທຶກ log.
import logger from '../utils/logger';



// ກຳນົດ interface `User` ໃຫ້ຖືກຕ້ອງຕາມໂຄງສ້າງໃນ database schema ຫຼາຍຂຶ້ນ.
// `extends RowDataPacket` ເພື່ອໃຫ້ເຂົ້າກັນໄດ້ກັບ type ຜົນລັບຈາກ `mysql2`.




// --- ການລົງທະບຽນດ້ວຍອີເມວ/ລະຫັດຜ່ານ (Email/Password Registration) ---
// Function asynchronous ສຳລັບການລົງທະບຽນຜູ້ໃຊ້ໃໝ່.
// ຮັບ `pool` (database connection pool) ແລະ `input` (ຂໍ້ມູນຈາກ client ທີ່ກົງກັບ `SignupInput`) ເປັນ parameters.
export const registerUserService = async (input: SignupInput): Promise<Omit<User, 'password_hash'>> => {
    logger.debug({ input }, 'Attempting to register user (email/phone)');
    const { email, phoneNumber, password, fullName, username } = input;

    try {
        if (email) {
            const existingEmail = await prisma.user.findUnique({ where: { email } });
            if (existingEmail) {
                logger.warn({ email }, 'Registration failed: Email already exists');
                throw new ApiError(409, 'Email address is already registered.', true);
            }
        }
        if (phoneNumber) {
            const existingPhone = await prisma.user.findUnique({ where: { phone_number: phoneNumber } });
            if (existingPhone) {
                logger.warn({ phoneNumber }, 'Registration failed: Phone number already registered');
                throw new ApiError(409, 'Phone number is already registered.', true);
            }
        }
        if (username) {
            const existingUsername = await prisma.user.findUnique({ where: { username } });
            if (existingUsername) {
                logger.warn({ username }, 'Registration failed: Username already taken');
                throw new ApiError(409, 'Username already taken.', true);
            }
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await prisma.user.create({
            data: {
                email: email ?? '', // Ensure email is always a string
                phone_number: phoneNumber || undefined,
                password_hash: hashedPassword, // Use only the hash string
                full_name: fullName,
                username: username,
                user_role: UserRole.client, // ใช้ Enum จาก Prisma
            },
            select: {
                user_id: true,
                email: true,
                phone_number: true,
                full_name: true,
                username: true,
                user_role: true,
                created_at: true,
                updated_at: true,
                avatar_url: true,
                wedding_date: true,
                planning_status: true,
                phone_verified_at: true,
                total_budget: true
                // ไม่ต้อง select password_hash
            }
        });

        logger.info({ userId: newUser.user_id, email, phoneNumber }, 'User registered successfully (email/phone)');
        return newUser;

    } catch (error: any) {
        logger.error({ err: error }, 'Error during user registration (email/phone)');
        if (error instanceof ApiError) throw error;
        if (error.code === 'P2002') { // Prisma unique constraint violation
            if (error.meta?.target?.includes('email')) throw new ApiError(409, 'Email address is already registered.', true);
            if (error.meta?.target?.includes('phone_number')) throw new ApiError(409, 'Phone number is already registered.', true);
            if (error.meta?.target?.includes('username')) throw new ApiError(409, 'Username already taken.', true);
        }
        throw new ApiError(500, 'Could not register user due to a server error', false);
    }
};

// --- ການເຂົ້າສູ່ລະບົບແບບລວມ (Universal Login) (ອີເມວ, ອາດຈະຮອງຮັບເບີໂທໃນພາຍຫຼັງ) ---
// Function asynchronous ສຳລັບການ login.
// ຮັບ `pool` ແລະ `input` (ຂໍ້ມູນທີ່ກົງກັບ `LoginInput`) ເປັນ parameters.
export const loginUserService = async (input: LoginInput) => {
    logger.debug({ identifier: input.identifier }, 'Attempting user login (email/phone)');
    const { identifier, password } = input;

    try {
        // พยายามหา User ด้วย Email หรือ Phone Number
        // Prisma ใช้ OR ใน where clause สำหรับการค้นหาแบบนี้
        const user: User | null = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { phone_number: identifier }
                ]
            }
        });

        if (!user) {
            logger.warn({ identifier }, 'Login failed: User not found with identifier');
            throw new UnauthorizedError('Invalid credentials.'); // ใช้ Message กลางๆ
        }

        const isValidPassword = await comparePassword(password, user.password_hash);
        if (!isValidPassword) {
            logger.warn({ identifier, userId: user.user_id }, 'Login failed: Invalid password');
            throw new UnauthorizedError('Invalid credentials.'); // ใช้ Message กลางๆ
        }

        const payload = { userId: user.user_id, email: user.email, phoneNumber: user.phone_number, role: user.user_role };
        const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '1d' });

        logger.info({ userId: user.user_id, identifier }, 'User logged in successfully (email/phone)');
        return {
            token,
            user: {
                userId: user.user_id,
                email: user.email,
                phoneNumber: user.phone_number,
                fullName: user.full_name,
                username: user.username,
                role: user.user_role,
                /* user_id: user.user_id, //ซ้ำซ้อนกับ userId ด้านบน เอาออกได้
                // password_hash: user.password_hash, // ไม่ควรมี
                planning_status: user.planning_status,
                avatar_url: user.avatar_url,
                phone_verified_at: user.phone_verified_at,
                total_budget: user.total_budget,
                wedding_date: user.wedding_date,
                created_at: user.created_at,
                updated_at: user.updated_at, */
            }
        };
    } catch (error: any) {
        logger.error({ err: error }, 'Error during user login (email/phone)');
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, 'Could not login user due to a server error', false);
    }
};