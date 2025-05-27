// ນຳເຂົ້າ object `z` ຈາກ library 'zod'.
// `zod` ເປັນ library ທີ່ຊ່ວຍໃນການກຳນົດໂຄງສ້າງ (schema) ແລະ ກວດສອບຄວາມຖືກຕ້ອງ (validation)
// ຂອງຂໍ້ມູນໃນ TypeScript/JavaScript ຢ່າງມີປະສິດທິພາບ ແລະ ປອດໄພທາງດ້ານ type.
import { z } from 'zod';

// ປະກາດ ແລະ export schema ຄົງທີ່ (const) ຊື່ `SignupSchema`.
// Schema ນີ້ໃຊ້ `z.object()` ເພື່ອກຳນົດວ່າຂໍ້ມູນທີ່ຄາດຫວັງຄວນຈະເປັນ object.
// Schema ນີ້ຖືກອອກແບບມາເພື່ອກວດສອບ object request ທັງໝົດ (ມັກຈະເປັນ `req` ໃນ Express),


const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164-like pattern
// ໂດຍມີການກຳນົດ schema ຍ່ອຍສຳລັບ `body`.
export const SignupSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional().nullable(), // ทำให้ optional
    phoneNumber: z.string().regex(phoneRegex, 'Invalid phone number format. Use E.164 format.').optional().nullable(), // ทำให้ optional
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    fullName: z.string().min(2, 'Full name is required').optional().nullable(),
    username: z.string().min(4, 'Username must be at least 4 characters').trim().optional().nullable(),
  }).refine(data => data.email || data.phoneNumber, { // ต้องมี email หรือ phoneNumber อย่างน้อยหนึ่งอย่าง
    message: "Either email or phone number must be provided for registration.",
    path: ["email", "phoneNumber"], // path ของ error
  }),
});

// ປະກາດ ແລະ export type ຂອງ TypeScript ຊື່ `SignupInput`.
// `z.infer<typeof SignupSchema>`: ໃຊ້ utility `infer` ຂອງ Zod ເພື່ອສ້າງ TypeScript type
// ໂດຍອັດຕະໂນມັດຈາກໂຄງສ້າງຂອງ `SignupSchema` ທີ່ໄດ້ກຳນົດໄວ້.
// `['body']`: ເປັນການເລືອກເອົາສະເພາະ type ຂອງ object `body` ທີ່ຢູ່ພາຍໃນ `SignupSchema`.
// ຜົນລັບ: `SignupInput` ຈະເປັນ type ທີ່ກົງກັບໂຄງສ້າງຂອງຂໍ້ມູນທີ່ຄາດຫວັງໃນ `req.body` ສຳລັບການລົງທະບຽນ,
// ເຊິ່ງຊ່ວຍໃຫ້ມີ type safety ເມື່ອນຳໄປໃຊ້ໃນ code ສ່ວນອື່ນ (ເຊັ່ນ ໃນ controller handlers).
export type SignupInput = z.infer<typeof SignupSchema>['body'];

// ປະກາດ ແລະ export schema ຄົງທີ່ (const) ຊື່ `LoginSchema`.
// Schema ນີ້ກຳນົດໂຄງສ້າງຂໍ້ມູນທີ່ຄາດຫວັງສຳລັບການເຂົ້າສູ່ລະບົບ (login).
export const LoginSchema = z.object({
  body: z.object({
    // ใช้ identifier แทน email/phoneNumber เพื่อให้ Client ส่งมา field เดียว
    identifier: z.string().min(1, "Email or phone number is required"),
    password: z.string().min(1, 'Password is required'),
  }),
});
// ປະກາດ ແລະ export type ຂອງ TypeScript ຊື່ `LoginInput`.
// ເຮັດວຽກຄືກັນກັບ `SignupInput` ແຕ່ສ້າງ type ຈາກ `LoginSchema` ແລະ ເລືອກເອົາ type ຂອງ `body`.
// ໃຊ້ສຳລັບ type safety ເມື່ອຈັດການຂໍ້ມູນ `req.body` ສຳລັບການເຂົ້າສູ່ລະບົບ.
export type LoginInput = z.infer<typeof LoginSchema>['body'];


/**
 * @openapi
 * components:
 *   schemas:
 *     UserInputBase:
 *       type: object
 *       properties:
 *         email: { type: "string", format: "email", nullable: true }
 *         phoneNumber: { type: "string", format: "phone", nullable: true }
 *         fullName: { type: "string", nullable: true }
 *         username: { type: "string", nullable: true }
 *
 *     SignupBody: # เปลี่ยนชื่อจาก SignupInput เพื่อไม่ให้ชนกับ Type
 *       type: object
 *       # required: [password] # email หรือ phoneNumber อย่างน้อยหนึ่งอย่าง
 *       properties:
 *         email: { type: "string", format: "email", nullable: true, example: "user@example.com" }
 *         phoneNumber: { type: "string", format: "phone", nullable: true, example: "+12345678900" }
 *         password: { type: "string", format: "password", minLength: 6, example: "password123" }
 *         fullName: { type: "string", minLength: 2, nullable: true, example: "Test User" }
 *         username: { type: "string", minLength: 4, nullable: true, example: "testuser" }
 *       example:
 *         email: "user@example.com"
 *         password: "password123"
 *         fullName: "Test User"
 *
 *     LoginBody: # เปลี่ยนชื่อจาก LoginInput
 *       type: object
 *       required: [identifier, password]
 *       properties:
 *         identifier: { type: "string", description: "User's email or phone number", example: "user@example.com or +12345678900" }
 *         password: { type: "string", format: "password", example: "password123" }
 */



