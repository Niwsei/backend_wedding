// ນຳເຂົ້າ types `Pool` (ສຳລັບ connection pool), `RowDataPacket` (type ພື້ນຖານສຳລັບຂໍ້ມູນທີ່ໄດ້ຈາກ query),
// ແລະ `ResultSetHeader` (type ສຳລັບຜົນລັບຈາກຄຳສັ່ງ INSERT/UPDATE/DELETE) ຈາກ library 'mysql2/promise'.
import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// ນຳເຂົ້າ default export (`redisClient`) ແລະ named export (`closeRedisConnection`) ຈາກ file `redis` ໃນ `config`.
// `closeRedisConnection` ອາດຈະບໍ່ໄດ້ຖືກໃຊ້ໂດຍກົງໃນ file ນີ້ (ຕາມ comment).
import redisClient, { closeRedisConnection } from '../config/redis'; // Note: closeRedisConnection is likely unused here

// ນຳເຂົ້າ function `sendOtpSms` ຈາກ file `otp.service.ts` (ທີ່ຢູ່ໃນ folder ດຽວກັນ).
// function ນີ້ໃຊ້ເພື່ອສົ່ງ SMS ທີ່ມີລະຫັດ OTP.
import { sendOtpSms } from './otp.service';

// ນຳເຂົ້າ functions `hashPassword` (ສຳລັບສ້າງ hash ຈາກລະຫັດຜ່ານ) ແລະ `comparePassword` (ສຳລັບປຽບທຽບລະຫັດຜ່ານກັບ hash)
// ຈາກ file `password` ໃນ folder `utils`.
import { hashPassword, comparePassword } from '../utils/password';

// ນຳເຂົ້າ types `SignupInput` ແລະ `LoginInput` ຈາກ file `auth.schema.ts`.
// ເຫຼົ່ານີ້ແມ່ນ types ທີ່ໄດ້ຈາກ Zod schemas ສຳລັບ input ການລົງທະບຽນ ແລະ login.
import { SignupInput, LoginInput } from '../schemas/auth.schema';

// ນຳເຂົ້າ types `RequestOtpInput` ແລະ `VerifyOtpInput` ຈາກ file `otp.schema.ts`.
// ເຫຼົ່ານີ້ແມ່ນ types ທີ່ໄດ້ຈາກ Zod schemas ສຳລັບ input ການຂໍ ແລະ ຢືນຢັນ OTP.
import { RequestOtpInput, VerifyOtpInput } from '../schemas/otp.schema';

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

// ນຳເຂົ້າ module `crypto` ຂອງ Node.js ເພື່ອໃຊ້ສ້າງ OTP.
import crypto from 'crypto';

// ກຳນົດ interface `User` ໃຫ້ຖືກຕ້ອງຕາມໂຄງສ້າງໃນ database schema ຫຼາຍຂຶ້ນ.
// `extends RowDataPacket` ເພື່ອໃຫ້ເຂົ້າກັນໄດ້ກັບ type ຜົນລັບຈາກ `mysql2`.
interface User extends RowDataPacket {
    user_id: number; // ID ຂອງຜູ້ໃຊ້ (primary key)
    email: string | null; // ອີເມວ (ອາດຈະເປັນ null ຖ້າລົງທະບຽນດ້ວຍເບີໂທ)
    phone_number: string | null; // ເບີໂທ (ອາດຈະເປັນ null ຖ້າລົງທະບຽນດ້ວຍອີເມວ)
    password_hash: string; // Hash ຂອງລະຫັດຜ່ານ
    full_name?: string | null; // ຊື່ເຕັມ (optional, ອາດຈະເປັນ null)
    username?: string | null; // ຊື່ຜູ້ໃຊ້ (optional, ອາດຈະເປັນ null)
    phone_verified_at?: Date | string | null; // ວັນເວລາທີ່ຢືນຢັນເບີໂທ (DB ອາດຈະສົ່ງກັບມາເປັນ string, optional, null)
    created_at: Date | string; // ວັນເວລາທີ່ສ້າງບັນຊີ (DB ອາດຈະສົ່ງກັບມາເປັນ string)
}

// ກຳນົດຄ່າຄົງທີ່ສຳລັບໄລຍະເວລາທີ່ OTP ໃຊ້ງານໄດ້ (ເປັນວິນາທີ).
const OTP_EXPIRY_SECONDS = 5 * 60; // 5 ນາທີ

// Function ສຳລັບສ້າງລະຫັດ OTP ແບບສຸ່ມ 6 ຫຼັກ.
// `crypto.randomInt(min, max)` ໃຊ້ສ້າງໂຕເລກ integer ແບບສຸ່ມລະຫວ່າງ min (ລວມ) ແລະ max (ບໍ່ລວມ).
// `.toString()` ແປງເປັນ string.
const generateOtp = (): string => crypto.randomInt(100000, 999999).toString();

// --- ການລົງທະບຽນດ້ວຍອີເມວ/ລະຫັດຜ່ານ (Email/Password Registration) ---
// Function asynchronous ສຳລັບການລົງທະບຽນຜູ້ໃຊ້ໃໝ່.
// ຮັບ `pool` (database connection pool) ແລະ `input` (ຂໍ້ມູນຈາກ client ທີ່ກົງກັບ `SignupInput`) ເປັນ parameters.
export const registerUserService = async (pool: Pool, input: SignupInput) => {
    // ບັນທຶກ log ລະດັບ debug ວ່າກຳລັງພະຍາຍາມລົງທະບຽນ, ພ້ອມກັບອີເມວ.
    logger.debug({ email: input.email }, 'Attempting email/password registration');
    // Destructure ເອົາຄ່າຕ່າງໆຈາກ object `input`.
    const { email, password, fullName, username } = input;
    // ຂໍ connection ຈາກ pool. `await` ລໍຖ້າຈົນກວ່າຈະໄດ້ connection.
    const connection = await pool.getConnection();
    // ເລີ່ມ block `try` ເພື່ອຈັດການ error ທີ່ອາດຈະເກີດຂຶ້ນ.
    try {
        // ສອບຖາມ (query) ຖານຂໍ້ມູນ ເພື່ອກວດສອບວ່າມີ user_id ທີ່ໃຊ້ອີເມວນີ້ຢູ່ແລ້ວ ຫຼື ບໍ່.
        // `LIMIT 1` ເພື່ອໃຫ້ query ຢຸດທັນທີທີ່ພົບ record ທຳອິດ.
        // `<User[]>` ບອກ TypeScript ວ່າຜົນລັບທີ່ຄາດຫວັງເປັນ array ຂອງ object `User`.
        const [existingUsers] = await connection.query<User[]>('SELECT user_id FROM Users WHERE email = ? LIMIT 1', [email]);
        // ກວດສອບຈຳນວນ record ທີ່ພົບ.
        if (existingUsers.length > 0) {
    logger.warn({ email }, 'Registration failed: Email already exists');
    // throw new BadRequestError('Email address is already registered.'); // เปลี่ยนเป็น
    throw new ApiError(409, 'Email address is already registered.', true); // 409 Conflict
}

        // ເອີ້ນ function `hashPassword` ເພື່ອສ້າງ hash ຈາກ `password` ທີ່ client ສົ່ງມາ.
        const { hash: hashedPassword } = await hashPassword(password);

        // ເພີ່ມ (INSERT) ຂໍ້ມູນຜູ້ໃຊ້ໃໝ່ເຂົ້າໄປໃນຕາຕະລາງ `Users`.
        // (phone_number ແລະ phone_verified_at ຈະເປັນ NULL ໂດຍ default ຕາມ schema).
        // `<ResultSetHeader>` ບອກ TypeScript ວ່າຜົນລັບຈາກ INSERT ຄາດວ່າຈະເປັນ object ປະເພດ `ResultSetHeader`.
        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO Users (email, password_hash, full_name, username) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, fullName, username] // ສົ່ງຄ່າທີ່ຕ້ອງການ insert ເຂົ້າໄປ.
        );

        // ກວດສອບວ່າການ INSERT ສຳເລັດ ແລະ ໄດ້ `insertId` (ID ຂອງ record ທີ່ຖືກສ້າງໃໝ່) ຫຼື ບໍ່.
        if (!result.insertId) {
            // ຖ້າບໍ່ໄດ້ `insertId`, ໂຍນ `ApiError` ລະດັບ 500 ອອກໄປ (ເປັນ non-operational error).
             throw new ApiError(500, 'Failed to register user account.', false);
        }

        // ບັນທຶກ log ລະດັບ info ວ່າການລົງທະບຽນສຳເລັດ, ພ້ອມກັບ userId ແລະ email.
        logger.info({ userId: result.insertId, email }, 'User registered successfully via email/password.');

        // ສອບຖາມຂໍ້ມູນຜູ້ໃຊ້ໃໝ່ທີ່ຫາກໍສ້າງ (ເອົາສະເພາະບາງ field) ເພື່ອສົ່ງກັບ (ຂັ້ນຕອນນີ້ອາດຈະຂ້າມໄປກໍໄດ້).
        const [newUser] = await connection.query<User[]>('SELECT user_id, email, full_name, username FROM Users WHERE user_id = ?', [result.insertId]);
        // ສົ່ງຄືນ object ຜູ້ໃຊ້ໃໝ່ (record ທຳອິດທີ່ພົບ).
        return newUser[0];

    // ເລີ່ມ block `catch` ເພື່ອດັກຈັບ error.
    } catch (error) {
        // ບັນທຶກ log ລະດັບ error, ພ້ອມ object error.
        logger.error({ err: error }, 'Error during email/password registration');
        // ກວດສອບວ່າ error ທີ່ຈັບໄດ້ບໍ່ແມ່ນ `ApiError` ທີ່ throw ໄວ້ກ່ອນໜ້ານີ້.
        if (!(error instanceof ApiError)) {
            // ຖ້າເປັນ error ອື່ນທີ່ບໍ່ຄາດຄິດ, ໃຫ້ຫໍ່ (wrap) ມັນດ້ວຍ `ApiError` ລະດັບ 500 (non-operational).
            throw new ApiError(500, 'Could not register user due to a server error.', false);
        }
        // ຖ້າເປັນ `ApiError` ຢູ່ແລ້ວ (ເຊັ່ນ `BadRequestError`), ໃຫ້ throw ມັນອອກໄປຕໍ່.
        throw error;
    // ເລີ່ມ block `finally` ເຊິ່ງຈະເຮັດວຽກສະເໝີ (ບໍ່ວ່າ try ຈະສຳເລັດ ຫຼື ເກີດ error).
    } finally {
        // ຄືນ (release) connection ກັບຄືນສູ່ pool. **ສຳຄັນຫຼາຍ!**
        connection.release();
    }
};

// --- ການເຂົ້າສູ່ລະບົບແບບລວມ (Universal Login) (ອີເມວ, ອາດຈະຮອງຮັບເບີໂທໃນພາຍຫຼັງ) ---
// Function asynchronous ສຳລັບການ login.
// ຮັບ `pool` ແລະ `input` (ຂໍ້ມູນທີ່ກົງກັບ `LoginInput`) ເປັນ parameters.
export const loginUserService = async (pool: Pool, input: LoginInput) => {
    // ບັນທຶກ log ລະດັບ debug ວ່າກຳລັງພະຍາຍາມ login, ພ້ອມກັບອີເມວ.
    logger.debug({ email: input.email }, 'Attempting user login');
    // Destructure ເອົາ email ແລະ password ຈາກ input.
    const { email, password } = input;
    // ຂໍ connection ຈາກ pool.
    const connection = await pool.getConnection();
    // ເລີ່ມ block `try`.
    try {
        // ສອບຖາມຂໍ້ມູນ user ຈາກ database ໂດຍອີງໃສ່ `email`. ເອົາ field ທີ່ຈຳເປັນສຳລັບການກວດສອບ ແລະ ສ້າງ token.
        const [users] = await connection.query<User[]>(
            'SELECT user_id, email, phone_number, password_hash, full_name FROM Users WHERE email = ? LIMIT 1',
            [email]
        );
        // ເອົາ object user ທຳອິດຈາກ array ຜົນລັບ.
        const user = users[0];

        // ກວດສອບວ່າພົບ user ຫຼື ບໍ່.
        if (!user) {
            // ຖ້າບໍ່ພົບ, ໂຍນ `UnauthorizedError` (ບໍ່ຄວນບອກວ່າອີເມວ ຫຼື ລະຫັດຜ່ານຜິດ ເພື່ອຄວາມປອດໄພ).
            throw new UnauthorizedError('Invalid email or password.');
        }

        // ໃຊ້ function `comparePassword` ເພື່ອປຽບທຽບ `password` ທີ່ client ສົ່ງມາ ກັບ `password_hash` ທີ່ເກັບໃນ database.
        const isValidPassword = await comparePassword(password, user.password_hash);
        // ກວດສອບວ່າລະຫັດຜ່ານຖືກຕ້ອງ ຫຼື ບໍ່.
        if (!isValidPassword) {
            // ຖ້າບໍ່ຖືກຕ້ອງ, ໂຍນ `UnauthorizedError`.
            throw new UnauthorizedError('Invalid email or password.');
        }

        // ສາມາດເພີ່ມການກວດສອບອື່ນໆໄດ້ທີ່ນີ້, ເຊັ່ນ: ບັນຊີຖືກ active/verified ແລ້ວ ຫຼື ບໍ່.

        // ສ້າງ object `payload` ທີ່ຈະບັນຈຸໃນ JWT. ຄວນໃສ່ຂໍ້ມູນທີ່ກ່ຽວຂ້ອງ ແລະ ບໍ່ sensitive.
        // `id: user.user_id` ອາດຈະຊໍ້າຊ້ອນກັບ `userId` ແຕ່ອາດຈະເພີ່ມເພື່ອຄວາມເຂົ້າກັນໄດ້ກັບລະບົບອື່ນ.
        const payload = { userId: user.user_id, id: user.user_id, email: user.email, phone: user.phone_number };
        // ສ້າງ (sign) JWT token ໂດຍໃຊ້ `jwt.sign`.
        // ໃສ່ `payload`, `config.JWT_SECRET` (ລະຫັດລັບ), ແລະ options:
        const token = jwt.sign(payload, config.JWT_SECRET,
             { expiresIn: '1d', // ກຳນົດອາຍຸຂອງ token (1 ມື້)
                algorithm: 'HS256', // ກຳນົດ algorithm (ອາດຈະໃຊ້ RS256 ຖ້າໃຊ້ public/private keys)
                issuer: 'backend_wedding', // ກຳນົດຜູ້ອອກ token (optional)
                audience: 'niw' // ກຳນົດຜູ້ຮັບ token (optional)
              }); // Or longer/shorter based on policy

        // ບັນທຶກ log ລະດັບ info ວ່າ user login ສຳເລັດ.
        logger.info({ userId: user.user_id, email }, 'User logged in successfully.');
        // ສົ່ງຄືນ object ທີ່ມີ `token` ແລະ ຂໍ້ມູນ `user` (ເອົາສະເພາະບາງ field).
        return {
            token,
            user: { userId: user.user_id, email: user.email, fullName: user.full_name, phone_number: user.phone_number }
        };
    // ເລີ່ມ block `catch`.
    } catch (error) {
        // ບັນທຶກ log ລະດັບ error.
        logger.error({ err: error }, 'Error during user login');
        // ຫໍ່ error ທີ່ບໍ່ຄາດຄິດດ້ວຍ `ApiError` ລະດັບ 500.
        if (!(error instanceof ApiError)) {
            throw new ApiError(500, 'Could not login user due to a server error.', false);
        }
        // throw `ApiError` ເດີມອອກໄປ.
        throw error;
    // ເລີ່ມ block `finally`.
    } finally {
        // ຄືນ connection ກັບຄືນສູ່ pool.
        connection.release();
    }
};


// --- ການຂໍລະຫັດ OTP (Request OTP) ---
// Function asynchronous ສຳລັບການຂໍ OTP.
// ຮັບ `pool` ແລະ `input` (ຂໍ້ມູນທີ່ກົງກັບ `RequestOtpInput`) ເປັນ parameters.
// ສົ່ງຄືນ Promise ທີ່ເມື່ອສຳເລັດຈະໄດ້ object `{ message: string }`.
export const requestOtpService = async (pool: Pool, input: RequestOtpInput): Promise<{ message: string }> => {
    // Destructure ເອົາ `phone_number` ຈາກ input.
    const { phone_number } = input;
    // ສ້າງ key ສຳລັບເກັບ OTP ໃນ Redis (ເຊັ່ນ: "otp:+1234567890").
    const redisKey = `otp:${phone_number}`;
    // ບັນທຶກ log ລະດັບ debug ວ່າກຳລັງຂໍ OTP.
    logger.debug({ phone_number }, 'Requesting OTP for phone');

    // ຂໍ connection ຈາກ pool.
    const connection = await pool.getConnection();
    // ເລີ່ມ block `try`.
    try {
        // ກວດສອບໃນ database ວ່າມີເບີໂທນີ້ທີ່ຖືກ *ຢືນຢັນແລ້ວ* (`phone_verified_at IS NOT NULL`) ຢູ່ແລ້ວຫຼືບໍ່.
        // ເພື່ອປ້ອງກັນການຂໍ OTP ໃສ່ເບີທີ່ຖືກ verify ໄປແລ້ວ.
        const [existingUsers] = await connection.query<User[]>(
            'SELECT user_id FROM Users WHERE phone_number = ? AND phone_verified_at IS NOT NULL LIMIT 1',
            [phone_number]
        );
        // ຖ້າພົບ, ໂຍນ `BadRequestError` ອອກໄປ.
        if (existingUsers.length > 0) {
            throw new BadRequestError('Phone number is already verified for another account.');
        }

        // ກວດສອບເວລາທີ່ເຫຼືອ (Time-To-Live) ຂອງ key OTP ເກົ່າ (ຖ້າມີ) ໃນ Redis.
        const ttl = await redisClient.ttl(redisKey);
        // ກຳນົດເວລາຂັ້ນຕໍ່າທີ່ຕ້ອງລໍຖ້າກ່ອນສົ່ງ OTP ໃໝ່ (ເຊັ່ນ: 60 ວິນາທີ).
        const waitThreshold = OTP_EXPIRY_SECONDS - 60; // Prevent resend within first 'waitThreshold' seconds
        // ກວດເບິ່ງວ່າ key ເກົ່າຍັງມີຢູ່ (ttl > 0) ແລະ ເວລາທີ່ເຫຼືອ `ttl` ຍັງຫຼາຍກວ່າ `OTP_EXPIRY_SECONDS - waitThreshold`
        // (ໝາຍຄວາມວ່າ ຫາກໍສົ່ງ OTP ໄປບໍ່ດົນ, ຍັງບໍ່ເຖິງເວລາທີ່ອະນຸຍາດໃຫ້ສົ່ງໃໝ່).
        if (ttl > 0 && ttl > waitThreshold ) {
             // ຄຳນວນເວລາທີ່ຕ້ອງລໍຖ້າຕື່ມອີກ (ເປັນວິນາທີ).
             const waitTime = ttl - waitThreshold;
             // ໂຍນ `BadRequestError` ບອກໃຫ້ client ລໍຖ້າ.
             throw new BadRequestError(`Please wait ${waitTime} seconds before requesting a new OTP.`);
        }

        // ສ້າງລະຫັດ OTP ໃໝ່.
        const otpCode = generateOtp();
        // ບັນທຶກ log ລະດັບ debug ພ້ອມເບີໂທ ແລະ OTP ທີ່ສ້າງຂຶ້ນ.
        logger.debug({ phone_number, otp: otpCode }, 'Generated OTP');
        // ຄຳນວນ timestamp ທີ່ OTP ຈະໝົດອາຍຸ (ອາດຈະບໍ່ໄດ້ໃຊ້ໂດຍກົງ ແຕ່ເກັບໄວ້).
        const expiresAt = Date.now() + OTP_EXPIRY_SECONDS * 1000; // For potential check if needed

        // ເກັບ OTP ລົງໃນ Redis:
        // - `redisKey`: key ທີ່ໃຊ້ເກັບ.
        // - `JSON.stringify(...)`: ຄ່າທີ່ຈະເກັບ (ເປັນ JSON string ທີ່ມີ code ແລະ expiresAt).
        // - `'EX'`: ບອກ Redis ວ່າຈະກຳນົດເວລາໝົດອາຍຸເປັນວິນາທີ.
        // - `OTP_EXPIRY_SECONDS`: ເວລາໝົດອາຍຸ (5 ນາທີ).
        await redisClient.set(redisKey, JSON.stringify({ code: otpCode, expiresAt }), 'EX', OTP_EXPIRY_SECONDS);

        // ເອີ້ນ function `sendOtpSms` ເພື່ອສົ່ງ OTP ໄປຍັງເບີໂທ.
        // function ນີ້ຖືກອອກແບບໃຫ້ throw error ຖ້າການສົ່ງລົ້ມເຫຼວ.
        await sendOtpSms(phone_number, otpCode);

        // ບັນທຶກ log ລະດັບ info ວ່າຂໍ OTP ສຳເລັດ.
        logger.info({ phone_number }, 'ຮ້ອງຂໍ OTP ສຳເລັດແລ້ວ');
        // ສົ່ງຄືນ object ທີ່ມີຂໍ້ຄວາມບອກວ່າສົ່ງ OTP ສຳເລັດແລ້ວ.
        return { message: 'ສົ່ງ OTP ໄປໃຫ້ເບີໂທລະສັບຂອງທ່ານສຳເລັດແລ້ວ.' };

    // ເລີ່ມ block `catch`.
    } catch (error) {
        // ບັນທຶກ log ລະດັບ error, ພ້ອມ object error ແລະ ເບີໂທ.
        logger.error({ err: error, phone_number }, 'ເກີດຄວາມຜິດພາດໃນການຮ້ອງຂໍ OTP');
        // ຫໍ່ error ທີ່ບໍ່ຄາດຄິດດ້ວຍ `ApiError` ລະດັບ 500.
        if (!(error instanceof ApiError)) {
             throw new ApiError(500, 'ບໍ່ສາມາດຮ້ອງຂໍ OTP ໄດ້ເນື່ອງຈາກເຊີບເວີຜິດພາດ.', false);
        }
        // throw `ApiError` ເດີມອອກໄປ.
        throw error;
    // ເລີ່ມ block `finally`.
    } finally {
        // ຄືນ connection ກັບຄືນສູ່ pool.
        connection.release();
    }
};


// --- ການຢືນຢັນ OTP ແລະ ລົງທະບຽນ (Verify OTP & Register) ---
// Function asynchronous ສຳລັບການກວດສອບ OTP ແລະ ລົງທະບຽນຜູ້ໃຊ້.
// ຮັບ `pool` ແລະ `input` (ຂໍ້ມູນທີ່ກົງກັບ `VerifyOtpInput`) ເປັນ parameters.
export const verifyOtpAndRegisterService = async (pool: Pool, input: VerifyOtpInput) => {
    // Destructure ເອົາຄ່າຕ່າງໆຈາກ input.
    const { phone_number, otp, password, fullName, username /*, email */ } = input;
    // ສ້າງ Redis key.
    const redisKey = `otp:${phone_number}`;
    // ບັນທຶກ log ລະດັບ debug.
    logger.debug({ phone_number }, 'ການກວດສອບ OTP ແລະລົງທະບຽນຜູ້ໃຊ້');

    // ດຶງຂໍ້ມູນ OTP ທີ່ເກັບໄວ້ໃນ Redis ໂດຍໃຊ້ `redisKey`.
    const storedOtpData = await redisClient.get(redisKey);
    // ກວດສອບວ່າດຶງຂໍ້ມູນມາໄດ້ ຫຼື ບໍ່.
    if (!storedOtpData) {
        // ຖ້າບໍ່ມີ (key ໝົດອາຍຸ ຫຼື ບໍ່ເຄີຍມີ), ໂຍນ `BadRequestError`.
        throw new BadRequestError('OTP ບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸແລ້ວ.');
    }

    // ປະກາດໂຕແປ `otpInfo` ເພື່ອເກັບ object ຂໍ້ມູນ OTP ທີ່ແປງຈາກ JSON.
    let otpInfo: { code: string; expiresAt: number };
    // ໃຊ້ `try...catch` ເພື່ອແປງ (`parse`) JSON string ຈາກ Redis.
    try {
        otpInfo = JSON.parse(storedOtpData);
    } catch (e) {
        // ຖ້າ parse ລົ້ມເຫຼວ (ຂໍ້ມູນໃນ Redis ເສຍຫາຍ), ໂຍນ `ApiError` ລະດັບ 500.
         throw new ApiError(500, 'ຂໍ້ມູນ OTP ພາຍໃນຜິດພາດ.', false);
    }

    // ປຽບທຽບ `otpInfo.code` (OTP ທີ່ເກັບໄວ້) ກັບ `otp` (OTP ທີ່ client ສົ່ງມາ).
    if (otpInfo.code !== otp) {
        // Optional: ສາມາດເພີ່ມ logic ນັບຈຳນວນຄັ້ງທີ່ໃສ່ OTP ຜິດໃນ Redis ໄດ້ທີ່ນີ້.
        // ຖ້າ OTP ບໍ່ຖືກຕ້ອງ, ໂຍນ `BadRequestError`.
        throw new BadRequestError('ລະຫັດ OTP ບໍ່ຖຶກຕ້ອງ.');
    }

    // ຖ້າ OTP ຖືກຕ້ອງ, ໃຫ້ລົບ (delete) key OTP ອອກຈາກ Redis ທັນທີ ເພື່ອບໍ່ໃຫ້ໃຊ້ຊ້ຳໄດ້.
    await redisClient.del(redisKey);
    // ບັນທຶກ log ລະດັບ debug.
    logger.debug({ phone_number }, 'OTP ໄດ້ຮັບການຢືນຢັນແລ້ວ, ລົບ OTP ອອກແລ້ວ.');

    // ຂໍ connection ຈາກ pool.
    const connection = await pool.getConnection();
    // ເລີ່ມ block `try` ສຳລັບການເຮັດວຽກກັບ database (ເຊິ່ງຈະຢູ່ໃນ transaction).
    try {
        // ເລີ່ມຕົ້ນ transaction. ການດຳເນີນງານທັງໝົດຫຼັງຈາກນີ້ຈົນຮອດ commit/rollback ຈະເປັນໜ່ວຍດຽວກັນ.
        await connection.beginTransaction();

        // ກວດສອບອີກຄັ້ງໃນ database ວ່າເບີໂທນີ້ຖືກລົງທະບຽນແລ້ວ ຫຼື ບໍ່ (ປ້ອງກັນ race condition).
        const [existingUsers] = await connection.query<User[]>(
            'SELECT user_id FROM Users WHERE phone_number = ? LIMIT 1', [phone_number]
        );
        // ຖ້າພົບວ່າມີເບີໂທນີ້ແລ້ວ:
        if (existingUsers.length > 0) {
             // ຍົກເລີກ (rollback) transaction.
             await connection.rollback();
             // ໂຍນ `BadRequestError`.
             throw new BadRequestError('ເບີໂທລະສັບນີ້ຖືກລົງທະບຽນແລ້ວ.');
        }

        // ສ້າງ hash ຈາກ `password`.
        const hashedPassword = await hashPassword(password);

        // ເພີ່ມ (INSERT) ຂໍ້ມູນຜູ້ໃຊ້ໃໝ່ເຂົ້າ database, ພ້ອມກັບເບີໂທ.
        // ຕັ້ງ `phone_verified_at` ເປັນເວລາປັດຈຸບັນ (NOW()) ເພື່ອໝາຍວ່າເບີນີ້ຖືກຢືນຢັນແລ້ວ.
        // `email` ຖືກຕັ້ງເປັນ NULL ໃນກໍລະນີນີ້.
        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO Users (phone_number, password_hash, full_name, username, phone_verified_at, email) VALUES (?, ?, ?, ?, NOW(), NULL)',
            [phone_number, hashedPassword, fullName, username]
        );

        // ກວດສອບວ່າ INSERT ສຳເລັດ ແລະ ໄດ້ `insertId` ຫຼື ບໍ່.
        if (!result.insertId) {
            // ຖ້າບໍ່, ໃຫ້ rollback transaction.
            await connection.rollback();
            // ໂຍນ `ApiError` ລະດັບ 500.
            throw new ApiError(500,'ລົ້ມເຫລວໃນການສ້າງບັນຊີຜູ້ໃຊ້.', false);
        }

        // ຖ້າທຸກຢ່າງສຳເລັດ, ໃຫ້ບັນທຶກ (commit) transaction. ການປ່ຽນແປງຈະຖືກບັນທຶກລົງ database ຖາວອນ.
        await connection.commit();
        // ບັນທຶກ log ລະດັບ info.
        logger.info({ userId: result.insertId, phone_number }, 'ຜູ້ໃຊ້ລົງທະບຽນຜ່ານ OTP ສໍາເລັດເເລ້ວ ');

        // ສ້າງ JWT payload ສຳລັບ user ໃໝ່.
        const payload = { userId: result.insertId, id: result.insertId, phone: phone_number };
        // ສ້າງ JWT token.
        const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '1d' });

        // ສອບຖາມຂໍ້ມູນ user ໃໝ່ (ເອົາສະເພາະບາງ field) ເພື່ອສົ່ງກັບ.
        const [newUser] = await connection.query<User[]>('SELECT user_id, phone_number, full_name, username FROM Users WHERE user_id = ?', [result.insertId]);

        // ສົ່ງຄືນ object ທີ່ມີ `token` ແລະ ຂໍ້ມູນ `user`.
        return { token, user: newUser[0] };

    // ເລີ່ມ block `catch` ສຳລັບ error ທີ່ເກີດຂຶ້ນຫຼັງຈາກ `beginTransaction`.
    } catch (error) {
        // ຖ້າມີ error ເກີດຂຶ້ນ, ໃຫ້ rollback transaction ເພື່ອຍົກເລີກການປ່ຽນແປງທັງໝົດ.
        await connection.rollback(); // Rollback on any error after beginTransaction
        // ບັນທຶກ log ລະດັບ error.
        logger.error({ err: error, phone_number }, 'ເກີດຄວາມຜິດພາດໃນລະຫວ່າງການກວດສອບ OTP/ການລົງທະບຽນທຸລະກຳ');
        // ຫໍ່ error ທີ່ບໍ່ຄາດຄິດດ້ວຍ `ApiError` ລະດັບ 500.
         if (!(error instanceof ApiError)) {
             throw new ApiError(500, 'ບໍ່ສາມາດສຳເລັດການລົງທະບຽນໄດ້ເນື່ອງຈາກເຊີບເວີຜິດພາດ.', false);
         }
        // throw `ApiError` ເດີມອອກໄປ.
        throw error;
    // ເລີ່ມ block `finally`.
    } finally {
        // ຄືນ connection ກັບຄືນສູ່ pool.
        connection.release();
    }
};