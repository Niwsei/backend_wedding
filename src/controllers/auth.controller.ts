// ນຳເຂົ້າ object ປະເພດ Request, Response, ແລະ NextFunction ຈາກ library 'express'.
// - Request: ຕາງໜ້າໃຫ້ HTTP request ທີ່ເຂົ້າມາ.
// - Response: ຕາງໜ້າໃຫ້ HTTP response ທີ່ຈະສົ່ງກັບໄປຫາ client.
// - NextFunction: ເປັນ function ທີ່ໃຊ້ເພື່ອສົ່ງຕໍ່ control ໄປຍັງ middleware ຕໍ່ໄປໃນ chain (ມັກໃຊ້ກັບ error handling).
import { Request, Response, NextFunction } from 'express';

// ນຳເຂົ້າ service functions ຕ່າງໆທີ່ກ່ຽວຂ້ອງກັບການยืนยันตัวตน (authentication) ຈາກ file `auth.service.ts`.
// - registerUserService: function ສຳລັບການລົງທະບຽນຜູ້ໃຊ້ໃໝ່ດ້ວຍອີເມວ/ລະຫັດຜ່ານ.
// - loginUserService: function ສຳລັບການກວດສອບຂໍ້ມູນ ແລະ ເຂົ້າສູ່ລະບົບ.
// - requestOtpService: function ສຳລັບການຂໍລະຫັດ OTP (One-Time Password).
// - verifyOtpAndRegisterService: function ສຳລັບການກວດສອບ OTP ແລະ ລົງທະບຽນຜູ້ໃຊ້ (ຖ້າ OTP ຖືກຕ້ອງ).
import {
    registerUserService, loginUserService, requestOtpService, verifyOtpAndRegisterService
} from '../services/auth.service';

// ນຳເຂົ້າ type `SignupInput` ແລະ `LoginInput` ຈາກ file `auth.schema.ts`.
// Types ເຫຼົ່ານີ້ຄາດວ່າຈະຖືກສ້າງໂດຍໃຊ້ library ເຊັ່ນ Zod ເພື່ອກຳນົດໂຄງສ້າງ ແລະ ກວດສອບຂໍ້ມູນ input ສຳລັບການລົງທະບຽນ ແລະ login.
import { SignupInput, LoginInput } from '../schemas/auth.schema';

// ນຳເຂົ້າ type `RequestOtpInput` ແລະ `VerifyOtpInput` ຈາກ file `otp.schema.ts`.
// Types ເຫຼົ່ານີ້ຄາດວ່າຈະກຳນົດໂຄງສ້າງ ແລະ ກວດສອບຂໍ້ມູນ input ສຳລັບການຂໍ ແລະ ຢືນຢັນ OTP.
import { RequestOtpInput, VerifyOtpInput } from '../schemas/otp.schema';

// ນຳເຂົ້າ `pool` (database connection pool) ຈາກ file `db.ts` ໃນ folder `config`.
// `pool` ນີ້ຈະຖືກໃຊ້ເພື່ອຕິດຕໍ່ກັບຖານຂໍ້ມູນ.
import pool from '../config/db';

// --- ການລົງທະບຽນດ້ວຍອີເມວ/ລະຫັດຜ່ານ (Email/Password Registration) ---
// ປະກາດ ແລະ export function handler ແບບ asynchronous ຊື່ `registerHandler`.
// Function ນີ້ຈະຖືກເອີ້ນເມື່ອມີ request ມາທີ່ route ການລົງທະບຽນ.
// `<Request<{}, {}, SignupInput>>` ເປັນການກຳນົດ type ໃຫ້ກັບ `req` object:
//   - `{}` ທຳອິດ: ໝາຍເຖິງ type ຂອງ `req.params` (ບໍ່ໄດ້ໃຊ້ໃນກໍລະນີນີ້).
//   - `{}` ທີສອງ: ໝາຍເຖິງ type ຂອງ `res.body` (ທີ່ສົ່ງກັບ, ບໍ່ໄດ້ກຳນົດ type ສະເພາະ).
//   - `SignupInput`: ໝາຍເຖິງ type ຂອງ `req.body` (ຂໍ້ມູນທີ່ client ສົ່ງມາ) ຕ້ອງກົງກັບ schema `SignupInput`.
export const registerHandler = async (req: Request<{}, {}, SignupInput>, res: Response, next: NextFunction) => {
  // ເລີ່ມຕົ້ນ block `try` ເພື່ອດັກຈັບ error ທີ່ອາດຈະເກີດຂຶ້ນໃນ service function.
  try {
    // ເອີ້ນ `registerUserService` ເພື່ອສ້າງຜູ້ໃຊ້ໃໝ່ໃນຖານຂໍ້ມູນ, ໂດຍສົ່ງ `pool` (connection pool)
    // ແລະ `req.body` (ຂໍ້ມູນຜູ້ໃຊ້ຈາກ client) ເຂົ້າໄປ.
    // `await` ຈະລໍຖ້າຈົນກວ່າ `registerUserService` ຈະເຮັດວຽກສຳເລັດ ແລະ ສົ່ງຄືນຂໍ້ມູນຜູ້ໃຊ້ໃໝ່.
    const newUser = await registerUserService(pool, req.body);
    // Destructuring object `newUser` ເພື່ອແຍກເອົາ `password_hash` ອອກ
    // ແລະ ເກັບ property ທີ່ເຫຼືອທັງໝົດໄວ້ໃນ object ໃໝ່ຊື່ `userWithoutPassword`.
    // `as any` ຖືກໃຊ້ຢູ່ບ່ອນນີ້ (ເຖິງອາດຈະບໍ່ແມ່ນວິທີທີ່ດີທີ່ສຸດ) ເພື່ອອະນຸຍາດໃຫ້ destructuring property ທີ່ບໍ່ໄດ້ລະບຸໃນ type ຕົ້ນສະບັບໄດ້ງ່າຍ.
    // ເຫດຜົນທີ່ເຮັດແບບນີ້: ເພື່ອບໍ່ໃຫ້ສົ່ງ password hash ກັບໄປຫາ client ໃນ response ເພື່ອຄວາມປອດໄພ.
    const { password_hash, ...userWithoutPassword } = newUser as any;
    // ສົ່ງ HTTP response ກັບໄປຫາ client:
    // - `res.status(201)`: ກຳນົດ status code ເປັນ 201 (Created) ເພາະມີການສ້າງ resource (user) ໃໝ່.
    // - `.json(...)`: ສົ່ງ response body ເປັນ JSON object ທີ່ມີ `status: 'success'`
    //   ແລະ `data` ທີ່ບັນຈຸ object `user` (ເຊິ່ງກໍຄື `userWithoutPassword`).
    res.status(201).json({ status: 'success', data: { user: userWithoutPassword } });
  // ເລີ່ມຕົ້ນ block `catch` ເຊິ່ງຈະເຮັດວຽກຖ້າມີ error ເກີດຂຶ້ນໃນ block `try`.
  } catch (error) {
    // ເອີ້ນ `next(error)` ເພື່ອສົ່ງ object `error` ທີ່ເກີດຂຶ້ນໄປໃຫ້ error handling middleware ຂອງ Express ຈັດການຕໍ່ໄປ.
    // ການເຮັດແບບນີ້ຊ່ວຍໃຫ້ມີການຈັດການ error ທີ່ເປັນລະບົບຢູ່ບ່ອນດຽວ.
    next(error);
  } // Pass ALL errors to errorHandler
};

// --- ການເຂົ້າສູ່ລະບົບ (Login) ---
// ປະກາດ ແລະ export function handler ແບບ asynchronous ຊື່ `loginHandler`.
// `<Request<{}, {}, LoginInput>>` ກຳນົດວ່າ `req.body` ຕ້ອງກົງກັບ schema `LoginInput`.
export const loginHandler = async (req: Request<{}, {}, LoginInput>, res: Response, next: NextFunction) => {
  // ເລີ່ມຕົ້ນ block `try`.
  try {
    // ເອີ້ນ `loginUserService` ເພື່ອກວດສອບຂໍ້ມູນການ login, ໂດຍສົ່ງ `pool` ແລະ `req.body` ເຂົ້າໄປ.
    // `await` ລໍຖ້າຜົນລັບ (ເຊັ່ນ: JWT token ຫຼື ຂໍ້ມູນ user).
    const result = await loginUserService(pool, req.body);
    // ສົ່ງ HTTP response ກັບໄປຫາ client:
    // - `res.status(200)`: ກຳນົດ status code ເປັນ 200 (OK) ເພາະ login ສຳເລັດ.
    // - `.json(...)`: ສົ່ງ response body ເປັນ JSON object ທີ່ມີ `status: 'success'`
    //   ແລະ `data` ທີ່ບັນຈຸ `result` (ເຊິ່ງອາດຈະເປັນ token ແລະ ຂໍ້ມູນ user).
    res.status(200).json({ status: 'success', data: result });
  // ເລີ່ມຕົ້ນ block `catch`.
  } catch (error) {
    // ສົ່ງ error ໄປໃຫ້ error handling middleware.
    next(error);
  }
};

// --- ການຂໍລະຫັດ OTP (Request OTP) ---
// ປະກາດ ແລະ export function handler ແບບ asynchronous ຊື່ `requestOtpHandler`.
// `<Request<{}, {}, RequestOtpInput>>` ກຳນົດວ່າ `req.body` ຕ້ອງກົງກັບ schema `RequestOtpInput` (ເຊັ່ນ: ມີເບີໂທລະສັບ).
export const requestOtpHandler = async (req: Request<{}, {}, RequestOtpInput>, res: Response, next: NextFunction) => {
    // ເລີ່ມຕົ້ນ block `try`.
    try {
        // ເອີ້ນ `requestOtpService` ເພື່ອຈັດການການສ້າງ ແລະ ສົ່ງ OTP, ໂດຍສົ່ງ `pool` ແລະ `req.body` ເຂົ້າໄປ.
        // `await` ລໍຖ້າຜົນລັບ (ເຊິ່ງໃນທີ່ນີ້ເປັນ object ທີ່ມີ property `message`).
        const result = await requestOtpService(pool, req.body);
        // ສົ່ງ HTTP response ກັບໄປຫາ client:
        // - `res.status(200)`: ກຳນົດ status code ເປັນ 200 (OK).
        // - `.json(...)`: ສົ່ງ response body ເປັນ JSON object ທີ່ມີ `status: 'success'`
        //   ແລະ `message` ຈາກ `result` (ເຊັ່ນ: "OTP sent successfully").
        res.status(200).json({ status: 'success', message: result.message });
    // ເລີ່ມຕົ້ນ block `catch`.
    } catch (error) {
      // ສົ່ງ error ໄປໃຫ້ error handling middleware.
      next(error);
    }
};

// --- ການຢືນຢັນ OTP ແລະ ລົງທະບຽນ (Verify OTP & Register) ---
// ປະກາດ ແລະ export function handler ແບບ asynchronous ຊື່ `verifyOtpHandler`.
// `<Request<{}, {}, VerifyOtpInput>>` ກຳນົດວ່າ `req.body` ຕ້ອງກົງກັບ schema `VerifyOtpInput` (ເຊັ່ນ: ມີເບີໂທລະສັບ ແລະ ລະຫັດ OTP).
export const verifyOtpHandler = async (req: Request<{}, {}, VerifyOtpInput>, res: Response, next: NextFunction) => {
    // ເລີ່ມຕົ້ນ block `try`.
    try {
        // ເອີ້ນ `verifyOtpAndRegisterService` ເພື່ອກວດສອບ OTP ແລະ ລົງທະບຽນຜູ້ໃຊ້ຖ້າ OTP ຖືກຕ້ອງ,
        // ໂດຍສົ່ງ `pool` ແລະ `req.body` ເຂົ້າໄປ.
        // `await` ລໍຖ້າຜົນລັບ (ເຊິ່ງອາດຈະເປັນຂໍ້ມູນ user ໃໝ່ ແລະ token).
        const result = await verifyOtpAndRegisterService(pool, req.body);
        // ສົ່ງ HTTP response ກັບໄປຫາ client:
        // - `res.status(201)`: ກຳນົດ status code ເປັນ 201 (Created) ເພາະຍ້ອນມີການສ້າງ user ໃໝ່.
        // - `.json(...)`: ສົ່ງ response body ເປັນ JSON object ທີ່ມີ `status: 'success'`
        //   ແລະ `data` ທີ່ບັນຈຸ `result` (ຂໍ້ມູນຈາກການຢືນຢັນ ແລະ ລົງທະບຽນ).
        res.status(201).json({ status: 'success', data: result });
    // ເລີ່ມຕົ້ນ block `catch`.
    } catch (error) {
      // ສົ່ງ error ໄປໃຫ້ error handling middleware.
      next(error);
    }
};