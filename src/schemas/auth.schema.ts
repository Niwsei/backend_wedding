// ນຳເຂົ້າ object `z` ຈາກ library 'zod'.
// `zod` ເປັນ library ທີ່ຊ່ວຍໃນການກຳນົດໂຄງສ້າງ (schema) ແລະ ກວດສອບຄວາມຖືກຕ້ອງ (validation)
// ຂອງຂໍ້ມູນໃນ TypeScript/JavaScript ຢ່າງມີປະສິດທິພາບ ແລະ ປອດໄພທາງດ້ານ type.
import { z } from 'zod';

// ປະກາດ ແລະ export schema ຄົງທີ່ (const) ຊື່ `SignupSchema`.
// Schema ນີ້ໃຊ້ `z.object()` ເພື່ອກຳນົດວ່າຂໍ້ມູນທີ່ຄາດຫວັງຄວນຈະເປັນ object.
// Schema ນີ້ຖືກອອກແບບມາເພື່ອກວດສອບ object request ທັງໝົດ (ມັກຈະເປັນ `req` ໃນ Express),
// ໂດຍມີການກຳນົດ schema ຍ່ອຍສຳລັບ `body`.
export const SignupSchema = z.object({
  // ກຳນົດ property `body` ພາຍໃນ `SignupSchema`.
  // ຄ່າຂອງມັນກໍເປັນ schema ອີກອັນທີ່ສ້າງດ້ວຍ `z.object`.
  // ນີ້ໝາຍຄວາມວ່າເຮົາຄາດຫວັງວ່າ object request ຈະມີ property `body`,
  // ແລະ ເນື້ອໃນຂອງ `body` ນັ້ນຕ້ອງກົງກັບ schema ທີ່ກຳນົດໄວ້ຂ້າງລຸ່ມນີ້.
  body: z.object({
    // ກຳນົດ field `email` ພາຍໃນ `body`:
    //   - `z.string()`: ຕ້ອງເປັນປະເພດ string (ຂໍ້ຄວາມ).
    //   - `.email('Invalid email address')`: ຕ້ອງເປັນຮູບແບບອີເມວທີ່ຖືກຕ້ອງຕາມມາດຕະຖານ.
    //     ຖ້າບໍ່ຖືກຕ້ອງ, ຈະໃຊ້ຂໍ້ຄວາມ error ວ່າ 'Invalid email address'.
    email: z.string().email('Invalid email address'),

    // ກຳນົດ field `password` ພາຍໃນ `body`:
    //   - `z.string()`: ຕ້ອງເປັນປະເພດ string.
    //   - `.min(6, 'Password must be at least 6 characters long')`: ຕ້ອງມີຄວາມຍາວຢ່າງໜ້ອຍ 6 ໂຕອັກສອນ.
    //     ຖ້າສັ້ນກວ່າ, ຈະໃຊ້ຂໍ້ຄວາມ error ທີ່ລະບຸໄວ້.
    password: z.string().min(6, 'Password must be at least 6 characters long'),

    // ກຳນົດ field `fullName` ພາຍໃນ `body`:
    //   - `z.string()`: ຕ້ອງເປັນປະເພດ string.
    //   - `.min(2, 'Full name is required')`: ຕ້ອງມີຄວາມຍາວຢ່າງໜ້ອຍ 2 ໂຕອັກສອນ (ຖ້າມີການສົ່ງຄ່າມາ).
    //     (ຂໍ້ຄວາມ error ອາດຈະສັບສົນເລັກນ້ອຍ ເພາະມັນເປັນ optional).
    //   - `.optional()`: field ນີ້ບໍ່ຈຳເປັນຕ້ອງມີກໍໄດ້ (ອາດຈະເປັນ `undefined`).
    fullName: z.string().min(2, 'Full name is required').optional(),

    // ກຳນົດ field `username` ພາຍໃນ `body`:
    //   - `z.string()`: ຕ້ອງເປັນປະເພດ string.
    //   - `.min(4, 'Username must be at least 4 characters long')`: ຕ້ອງມີຄວາມຍາວຢ່າງໜ້ອຍ 4 ໂຕອັກສອນ (ຖ້າມີການສົ່ງຄ່າມາ).
    //   - `.optional()`: field ນີ້ບໍ່ຈຳເປັນຕ້ອງມີກໍໄດ້.
    username: z.string().min(4, 'Username must be at least 4 characters long').optional(),
  }), // ສິ້ນສຸດ schema ຂອງ `body`
}); // ສິ້ນສຸດ `SignupSchema`

// ປະກາດ ແລະ export schema ຄົງທີ່ (const) ຊື່ `LoginSchema`.
// Schema ນີ້ກຳນົດໂຄງສ້າງຂໍ້ມູນທີ່ຄາດຫວັງສຳລັບການເຂົ້າສູ່ລະບົບ (login).
export const LoginSchema = z.object({
  // ຄືກັນກັບ `SignupSchema`, ກຳນົດ schema ຍ່ອຍສຳລັບ `body`.
  body: z.object({
    // ກຳນົດ field `email` ພາຍໃນ `body` (ເງື່ອນໄຂຄືກັນກັບຕອນ signup).
    email: z.string().email('Invalid email address'),
    // ກຳນົດ field `password` ພາຍໃນ `body`:
    //   - `z.string()`: ຕ້ອງເປັນປະເພດ string.
    //   - `.min(1, 'Password is required')`: ຕ້ອງມີຄວາມຍາວຢ່າງໜ້ອຍ 1 ໂຕອັກສອນ (ໝາຍຄວາມວ່າຫ້າມຫວ່າງເປົ່າ).
    password: z.string().min(1, 'Password is required'),
  }), // ສິ້ນສຸດ schema ຂອງ `body`
}); // ສິ້ນສຸດ `LoginSchema`

// ປະກາດ ແລະ export type ຂອງ TypeScript ຊື່ `SignupInput`.
// `z.infer<typeof SignupSchema>`: ໃຊ້ utility `infer` ຂອງ Zod ເພື່ອສ້າງ TypeScript type
// ໂດຍອັດຕະໂນມັດຈາກໂຄງສ້າງຂອງ `SignupSchema` ທີ່ໄດ້ກຳນົດໄວ້.
// `['body']`: ເປັນການເລືອກເອົາສະເພາະ type ຂອງ object `body` ທີ່ຢູ່ພາຍໃນ `SignupSchema`.
// ຜົນລັບ: `SignupInput` ຈະເປັນ type ທີ່ກົງກັບໂຄງສ້າງຂອງຂໍ້ມູນທີ່ຄາດຫວັງໃນ `req.body` ສຳລັບການລົງທະບຽນ,
// ເຊິ່ງຊ່ວຍໃຫ້ມີ type safety ເມື່ອນຳໄປໃຊ້ໃນ code ສ່ວນອື່ນ (ເຊັ່ນ ໃນ controller handlers).
export type SignupInput = z.infer<typeof SignupSchema>['body'];

// ປະກາດ ແລະ export type ຂອງ TypeScript ຊື່ `LoginInput`.
// ເຮັດວຽກຄືກັນກັບ `SignupInput` ແຕ່ສ້າງ type ຈາກ `LoginSchema` ແລະ ເລືອກເອົາ type ຂອງ `body`.
// ໃຊ້ສຳລັບ type safety ເມື່ອຈັດການຂໍ້ມູນ `req.body` ສຳລັບການເຂົ້າສູ່ລະບົບ.
export type LoginInput = z.infer<typeof LoginSchema>['body'];