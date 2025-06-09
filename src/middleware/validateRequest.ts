// validateRequest.ts
// ນຳເຂົ້າ object ປະເພດ Request, Response, ແລະ NextFunction ຈາກ library 'express'.
// ເຫຼົ່ານີ້ແມ່ນ object ຫຼັກທີ່ middleware ຂອງ Express ໃຊ້ງານ.
import { Request, Response, NextFunction } from 'express';

// ນຳເຂົ້າ class `ZodError` (class ຂອງຂໍ້ຜິດພາດທີ່ Zod ໂຍນອອກມາເມື່ອ validation ລົ້ມເຫຼວ)
// ແລະ type `ZodSchema` (type ທີ່ໃຊ້ສະແດງເຖິງ schema ທີ່ສ້າງຈາກ Zod) ຈາກ library 'zod'.
import { ZodError, ZodSchema, AnyZodObject  } from 'zod';

// ປະກາດ ແລະ export function ຊື່ `validateRequest`.
// Function ນີ້ບໍ່ແມ່ນ middleware ໂດຍກົງ, ແຕ່ມັນເປັນ "ໂຕສ້າງ middleware" (middleware factory).
// ມັນຮັບ object `schemas` ເຂົ້າມາ ແລະ ສົ່ງຄືນ function middleware ຕົວຈິງ.
export const validateRequest = (
  // Parameter `schemas`: ເປັນ object ທີ່ສາມາດບັນຈຸ schema ຂອງ Zod ສຳລັບ:
  //   - `body`: schema ສຳລັບກວດສອບ `req.body` (optional).
  //   - `query`: schema ສຳລັບກວດສອບ `req.query` (optional).
  //   - `params`: schema ສຳລັບກວດສອບ `req.params` (optional).
  // ເຄື່ອງໝາຍ `?` ໝາຍຄວາມວ່າບໍ່ຈຳເປັນຕ້ອງມີ schema ຄົບທັງສາມສ່ວນ.
  schemas: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
  }
) => {
  // ສ່ວນນີ້ຄືການສົ່ງຄືນ function middleware ຕົວຈິງ.
  // function ນີ້ຈະຮັບ `req`, `res`, ແລະ `next` ຕາມຮູບແບບມາດຕະຖານຂອງ Express middleware.
  // `: void` ບອກວ່າ function middleware ນີ້ບໍ່ໄດ້ສົ່ງຄືນຄ່າຫຍັງໂດຍກົງ (ແຕ່ຈະເອີ້ນ `next()` ຫຼື `res.json()`).
  return (req: Request, res: Response, next: NextFunction): void => {
    // ເລີ່ມຕົ້ນ block `try` ເພື່ອລອງກວດສອບຂໍ້ມູນ request ຕາມ schema ທີ່ໃຫ້ມາ
    // ແລະ ດັກຈັບຂໍ້ຜິດພາດທີ່ອາດຈະເກີດຂຶ້ນ (ໂດຍສະເພາະ `ZodError`).
    try {
        if (schemas.body) req.body = schemas.body.parse(req.body); // Assign parsed value back
      if (schemas.query) req.query = schemas.query.parse(req.query); // ***** GANTI INI *****
      if (schemas.params) req.params = schemas.params.parse(req.params); // Assign parsed value back
      next();
    // ເລີ່ມຕົ້ນ block `catch` ເຊິ່ງຈະເຮັດວຽກຖ້າມີ error ເກີດຂຶ້ນໃນ block `try` (ເຊັ່ນ `parse()` ລົ້ມເຫຼວ).
    } catch (error) {
      // ກວດສອບວ່າ `error` ທີ່ເກີດຂຶ້ນແມ່ນ instance ຂອງ `ZodError` ຫຼືບໍ່.
      if (error instanceof ZodError) {
        // ຖ້າແມ່ນ `ZodError`, ໃຫ້ສ້າງ array ຂອງຂໍ້ຄວາມ error ທີ່ອ່ານງ່າຍຂຶ້ນ.
        // `error.errors` ເປັນ array ຂອງ object ທີ່ບັນຈຸລາຍລະອຽດຂອງແຕ່ລະຂໍ້ຜິດພາດທີ່ພົບ.
        const errorMessages = error.errors.map((issue) => ({
          // `issue.path.join('.')`: ບອກວ່າ field ໃດທີ່ຜິດພາດ (ເຊັ່ນ 'email' ຫຼື 'address.street').
          field: issue.path.join('.'),
          // `issue.message`: ຂໍ້ຄວາມທີ່ Zod ສ້າງຂຶ້ນເພື່ອອະທິບາຍຂໍ້ຜິດພາດນັ້ນ.
          message: issue.message,
        }));
        // ສົ່ງ HTTP response ກັບໄປຫາ client:
        // - `res.status(400)`: ກຳນົດ status code ເປັນ 400 (Bad Request) ເພາະຂໍ້ມູນທີ່ສົ່ງມາບໍ່ຖືກຕ້ອງ.
        // - `.json(...)`: ສົ່ງ response body ເປັນ JSON object ທີ່ມີ:
        //   - `status: 'fail'`
        //   - `message: 'Validation failed'` (ການກວດສອບລົ້ມເຫຼວ)
        //   - `errors: errorMessages` (array ຂອງຂໍ້ຜິດພາດລະອຽດ).
        res.status(400).json({
          status: 'fail',
          message: 'Validation failed',
          errors: errorMessages,
        });
        // ໃຊ້ `return` ເພື່ອຢຸດການເຮັດວຽກຂອງ middleware ທັນທີຫຼັງຈາກສົ່ງ response 400.
        return;
      }

      // ຖ້າ error ທີ່ເກີດຂຶ້ນ *ບໍ່ແມ່ນ* `ZodError` (ເຖິງແມ່ນວ່າຈະເກີດຂຶ້ນໄດ້ຍາກໃນກໍລະນີນີ້),
      // ໃຫ້ສົ່ງ response 500 (Internal Server Error) ແບບທົ່ວໄປ.
      res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  }; // ສິ້ນສຸດ function middleware ທີ່ຖືກ return.
}; // ສິ້ນສຸດ function `validateRequest`.