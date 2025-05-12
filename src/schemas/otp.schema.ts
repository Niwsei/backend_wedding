// ນຳເຂົ້າ object `z` ຈາກ library 'zod'.
// ເຮົາໃຊ້ `zod` ເພື່ອກຳນົດໂຄງສ້າງຂໍ້ມູນ (schema) ແລະ ກວດສອບຄວາມຖືກຕ້ອງຂອງຂໍ້ມູນ input.
import { z } from 'zod';

// ປະກາດໂຕແປຄົງທີ່ (const) ຊື່ `phoneRegex` ເຊິ່ງເກັບຄ່າ regular expression.
// Regular expression ນີ້ (`/^\+?[1-9]\d{1,15}$/`) ໃຊ້ເພື່ອກວດສອບຮູບແບບເບີໂທລະສັບແບບງ່າຍໆ
// ໃຫ້ຄ້າຍຄືກັບຮູບແບບ E.164 (ເຊັ່ນ: +1234567890, ອາດຈະມີ ຫຼື ບໍ່ມີ + ກໍໄດ້, ໂຕທຳອິດຫ້າມເປັນ 0, ຕາມດ້ວຍໂຕເລກ 1-15 ໂຕ).
const phoneRegex = /^\+?[1-9]\d{1,15}$/; // Simple E.164-like pattern

// ປະກາດ ແລະ export schema ຄົງທີ່ (const) ຊື່ `RequestOtpSchema`.
// Schema ນີ້ໃຊ້ເພື່ອກວດສອບຂໍ້ມູນທີ່ສົ່ງເຂົ້າມາເມື່ອມີການ *ຂໍ* ລະຫັດ OTP.
export const RequestOtpSchema = z.object({
  // ກຳນົດວ່າ request ຕ້ອງມີ property `body`, ແລະ ເນື້ອໃນຂອງ `body` ຕ້ອງເປັນ object
  // ທີ່ກົງກັບ schema ທີ່ກຳນົດໄວ້ຂ້າງລຸ່ມນີ້.
  body: z.object({
    // ກຳນົດ field `phone_number` ພາຍໃນ `body`:
    //   - `z.string()`: ຄ່າຂອງ `phone_number` ຕ້ອງເປັນປະເພດ string.
    //   - `.regex(phoneRegex, '...')`: ຄ່າ string ນັ້ນຕ້ອງກົງກັບຮູບແບບທີ່ກຳນົດໄວ້ໃນ `phoneRegex`.
    //     ຖ້າບໍ່ກົງ, ຈະໃຊ້ຂໍ້ຄວາມ error ທີ່ລະບຸໄວ້: 'ຮູບແບບເບີໂທບໍ່ຖືກຕ້ອງ. ໃຊ້ຮູບແບບ E.164 (ຕົວຢ່າງ: +1234567890)'.
    phone_number: z.string().regex(phoneRegex, 'Invalid phone number format. Use E.164 format (e.g., +1234567890)'),
  }), // ສິ້ນສຸດ schema ຂອງ `body`
}); // ສິ້ນສຸດ `RequestOtpSchema`

// ປະກາດ ແລະ export schema ຄົງທີ່ (const) ຊື່ `VerifyOtpSchema`.
// Schema ນີ້ໃຊ້ເພື່ອກວດສອບຂໍ້ມູນທີ່ສົ່ງເຂົ້າມາເມື່ອມີການ *ຢືນຢັນ* ລະຫັດ OTP (ແລະ ອາດຈະລົງທະບຽນໄປພ້ອມ).
export const VerifyOtpSchema = z.object({
  // ຄືກັນ, ກຳນົດ schema ສຳລັບ `body` ຂອງ request.
  body: z.object({
    // ກຳນົດ field `phone_number`:
    //   - ຕ້ອງເປັນ string ແລະ ກົງກັບ `phoneRegex` (ຄືກັນກັບຕອນຂໍ OTP, ແຕ່ຂໍ້ຄວາມ error ອາດຈະແຕກຕ່າງ).
    phone_number: z.string().regex(phoneRegex, 'Invalid phone number format'),

    // ກຳນົດ field `otp`:
    //   - `z.string()`: ຕ້ອງເປັນປະເພດ string.
    //   - `.length(6, 'OTP must be 6 digits')`: ຕ້ອງມີຄວາມຍາວເທົ່າກັບ 6 ໂຕອັກສອນ (ຄາດວ່າຈະເປັນໂຕເລກ).
    //     ຖ້າຄວາມຍາວບໍ່ແມ່ນ 6, ຈະໃຊ້ຂໍ້ຄວາມ error ທີ່ລະບຸໄວ້.
    otp: z.string().length(6, 'OTP must be 6 digits'),

    // ກຳນົດ field `password`:
    //   - `z.string()`: ຕ້ອງເປັນປະເພດ string.
    //   - `.min(6, '...')`: ຕ້ອງມີຄວາມຍາວຢ່າງໜ້ອຍ 6 ໂຕອັກສອນ.
    password: z.string().min(6, 'Password must be at least 6 characters long'),

    // ກຳນົດ field `fullName` (optional):
    //   - `z.string().min(2, '...')`: ຖ້າມີການສົ່ງຄ່າມາ, ຕ້ອງເປັນ string ທີ່ມີຄວາມຍາວຢ່າງໜ້ອຍ 2 ໂຕອັກສອນ.
    //   - `.optional()`: field ນີ້ບໍ່ຈຳເປັນຕ້ອງມີກໍໄດ້.
    fullName: z.string().min(2, 'Full name is required').optional(),

    // ກຳນົດ field `username` (optional):
    //   - `z.string().min(4, '...')`: ຖ້າມີການສົ່ງຄ່າມາ, ຕ້ອງເປັນ string ທີ່ມີຄວາມຍາວຢ່າງໜ້ອຍ 4 ໂຕອັກສອນ.
    //   - `.optional()`: field ນີ້ບໍ່ຈຳເປັນຕ້ອງມີກໍໄດ້.
    username: z.string().min(4, 'Username must be at least 4 characters long').optional(),

    // ສ່ວນນີ້ຖືກ comment ໄວ້, ອາດຈະໝາຍເຖິງການພິຈາລະນາໃຫ້ສາມາດໃສ່ອີເມວ (ແບບ optional) ໃນຂະນະທີ່ລົງທະບຽນດ້ວຍ OTP ໄດ້.
    // email: z.string().email().optional(), // Optional email during OTP signup
  }), // ສິ້ນສຸດ schema ຂອງ `body`
}); // ສິ້ນສຸດ `VerifyOtpSchema`

// ປະກາດ ແລະ export type ຂອງ TypeScript ຊື່ `RequestOtpInput`.
// `z.infer<typeof RequestOtpSchema>`: ສ້າງ TypeScript type ຈາກ `RequestOtpSchema`.
// `['body']`: ເລືອກເອົາສະເພາະ type ຂອງ object `body` ທີ່ຢູ່ພາຍໃນ schema.
// ຜົນລັບ: `RequestOtpInput` ເປັນ type ທີ່ກົງກັບໂຄງສ້າງຂໍ້ມູນທີ່ຄາດຫວັງໃນ `req.body` ສຳລັບການຂໍ OTP.
export type RequestOtpInput = z.infer<typeof RequestOtpSchema>['body'];

// ປະກາດ ແລະ export type ຂອງ TypeScript ຊື່ `VerifyOtpInput`.
// ເຮັດວຽກຄືກັນກັບ `RequestOtpInput` ແຕ່ສ້າງ type ຈາກ `VerifyOtpSchema` ແລະ ເລືອກເອົາ type ຂອງ `body`.
// ໃຊ້ສຳລັບ type safety ເມື່ອຈັດການຂໍ້ມູນ `req.body` ສຳລັບການຢືນຢັນ OTP.
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>['body'];