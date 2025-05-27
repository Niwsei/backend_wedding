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
    registerUserService, loginUserService
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
  const bodyData = req.body as SignupInput; // ກຳນົດ type ຂອງ `req.body` ເພື່ອໃຫ້ TypeScript ஈາກວ່ານີ້ເປັນ `SignupInput`.
  try {
  
    const newUser = await registerUserService(bodyData);
    
    const { password_hash, ...userWithoutPassword } = newUser as any;
  
    res.status(201).json({ status: 'success', data: { user: newUser } });
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
   const bodyData = req.body as LoginInput;
  try {
 const result = await loginUserService(bodyData);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    // ສົ່ງ error ໄປໃຫ້ error handling middleware.
    next(error);
  }
};


