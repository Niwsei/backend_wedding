// ນຳເຂົ້າ object ປະເພດ Request, Response, NextFunction, ແລະ ErrorRequestHandler ຈາກ library 'express'.
// - ErrorRequestHandler ເປັນ type ທີ່ກຳນົດຮູບແບບ (signature) ຂອງ function ທີ່ໃຊ້ຈັດການຂໍ້ຜິດພາດໃນ Express.
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

// ນຳເຂົ້າ class `ApiError` ຈາກ file `apiError` ໃນ folder `errors`.
// Class ນີ້ຄາດວ່າຈະເປັນ custom error class ທີ່ບັນຈຸຂໍ້ມູນເພີ່ມເຕີມເຊັ່ນ statusCode ແລະ isOperational.
import ApiError from '../errors/apiError';

// ນຳເຂົ້າ `logger` ຈາກ file `logger` ໃນ folder `utils`.
// ໃຊ້ເພື່ອບັນທຶກ (log) ຂໍ້ມູນກ່ຽວກັບຂໍ້ຜິດພາດທີ່ເກີດຂຶ້ນ.
import logger from '../utils/logger';

// ນຳເຂົ້າ object `config` ຖ້າຕ້ອງການສຳລັບການກວດສອບ `NODE_ENV` (ຕາມຈິງໄດ້ນຳເຂົ້າແລ້ວຢູ່ເທິງ).
// ການ import ຊ້ຳບໍ່ຈຳເປັນ ແລະ ບໍ່ມີຜົນຫຍັງ, ແຕ່ເກັບໄວ້ຕາມ code ເດີມ.
import config from '../config';

// ປະກາດ ແລະ export function ທີ່ເຮັດໜ້າທີ່ຈັດການຂໍ້ຜິດພາດ (error handler middleware) ຊື່ `errorHandler`.
// ກຳນົດ type ໃຫ້ເປັນ `ErrorRequestHandler`. Middleware ນີ້ຈະຖືກເອີ້ນເມື່ອມີການເອີ້ນ `next(error)` ຈາກ middleware ຫຼື route handler ກ່ອນໜ້ານີ້.
export const errorHandler: ErrorRequestHandler = (
  // Parameter `err`: ຮັບ object ຂອງຂໍ້ຜິດພາດທີ່ເກີດຂຶ້ນ, ເຊິ່ງອາດຈະເປັນ `Error` ທົ່ວໄປ ຫຼື ເປັນ `ApiError` ທີ່ກຳນົດເອງ.
  err: Error | ApiError,
  // Parameter `req`: object Request ທີ່ກ່ຽວຂ້ອງກັບຂໍ້ຜິດພາດ.
  req: Request,
  // Parameter `res`: object Response ທີ່ກ່ຽວຂ້ອງກັບຂໍ້ຜິດພາດ.
  res: Response,
  // Parameter `next`: function NextFunction. ເຖິງແມ່ນວ່າຈະບໍ່ໄດ້ໃຊ້ໂດຍກົງໃນ logic ນີ້, ມັນຈຳເປັນຕ້ອງມີຢູ່ຕາມຮູບແບບຂອງ error handler middleware ໃນ Express.
  next: NextFunction // Keep next for signature, though unused here
) => {
  // ກຳນົດຄ່າເລີ່ມຕົ້ນສຳລັບການຕອບກັບຂໍ້ຜິດພາດ.
  let statusCode = 500; // HTTP status code ເລີ່ມຕົ້ນ (Internal Server Error).
  let message = 'Internal Server Error'; // ຂໍ້ຄວາມ error ເລີ່ມຕົ້ນ.
  let isOperational = false; // ໂຕບອກວ່າເປັນຂໍ້ຜິດພາດທີ່ຄາດການໄວ້ (operational) ຫຼື ບໍ່ (ເຊັ່ນ: validation error vs. unexpected crash).

  // ກວດສອບວ່າ `err` ທີ່ສົ່ງເຂົ້າມາແມ່ນ instance ຂອງ class `ApiError` ຫຼືບໍ່.
  if (err instanceof ApiError) {
    // ຖ້າແມ່ນ `ApiError`, ໃຫ້ດຶງຄ່າ `statusCode`, `message`, ແລະ `isOperational` ຈາກ object `err` ນັ້ນມາໃຊ້.
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else {
    // ຖ້າ `err` ບໍ່ແມ່ນ `ApiError` (ເຊັ່ນ: ເປັນ `Error` ທົ່ວໄປທີ່ບໍ່ໄດ້ຄາດການໄວ້).
    // ບັນທຶກ (log) ຂໍ້ຜິດພາດປະເພດນີ້ (non-operational) ໃຫ້ຮຸນແຮງກວ່າ, ໂດຍລວມມີ object error (`err`)
    // ແລະ stack trace (`err.stack`) ເພື່ອຊ່ວຍໃນການຊອກຫາບັນຫາ.
    logger.error({ err, stack: err.stack }, 'Unhandled Non-API Error occurred:');
  }

  // ບັນທຶກ (log) ລາຍລະອຽດຂອງຂໍ້ຜິດພາດທີ່ກຳລັງຖືກຈັດການນີ້ ເພື່ອໃຊ້ໃນການຕິດຕາມ (monitoring).
  // ຂໍ້ມູນທີ່ log ລວມມີ: statusCode, message, isOperational, HTTP method, URL ທີ່ຮ້ອງຂໍ, ແລະ ຊື່ຂອງ error.
  logger.error(
      { statusCode, message, isOperational, method: req.method, url: req.originalUrl, errName: err.name },
      `Error handled: ${message}`
  );

  // ກວດສອບວ່າ header ຂອງ response ໄດ້ຖືກສົ່ງໄປຫາ client ແລ້ວຫຼືຍັງ.
  // (ຖ້າ middleware ກ່ອນໜ້ານີ້ໄດ້ສົ່ງ response ໄປແລ້ວ, ເຮົາຈະສົ່ງ response ຊ້ຳບໍ່ໄດ້).
  if (res.headersSent) {
    // ຖ້າ header ຖືກສົ່ງໄປແລ້ວ, ໃຫ້ log ຄຳເຕືອນ.
    logger.warn('Headers already sent, cannot send error response.');
    // ສົ່ງ `err` ຕໍ່ໄປໃຫ້ default error handler ຂອງ Express ຈັດການ (ເຊິ່ງອາດຈະພຽງແຕ່ປິດ connection).
    // `return` ເພື່ອຢຸດການເຮັດວຽກຂອງ function ນີ້.
    return next(err); // Pass to default Express handler if headers sent
  }

  // ຕັດສິນໃຈວ່າຈະສົ່ງ response ແບບໃດໂດຍອີງໃສ່ສະຖານະ `isOperational` ແລະ ສະພາບແວດລ້ອມການເຮັດວຽກ.
  // ຖ້າ `isOperational` ເປັນ `true` (ເຊັ່ນ: ເປັນ `ApiError` ທີ່ຕັ້ງໃຈ throw ເຊັ່ນ validation error, not found).
  if (isOperational) {
     // ສົ່ງ response JSON ກັບໄປຫາ client ໂດຍໃຊ້ `statusCode` ແລະ `message` ຈາກ `ApiError` ນັ້ນໂດຍກົງ.
     res.status(statusCode).json({ status: 'error', statusCode, message });
  } else {
     // ຖ້າ `isOperational` ເປັນ `false` (ເຊັ່ນ: ເປັນ `Error` ທົ່ວໄປ ຫຼື `ApiError` ທີ່ໝາຍວ່າ non-operational - ຂໍ້ຜິດພາດທີ່ບໍ່ຄາດຄິດຂອງ server).
      // ປິດບັງລາຍລະອຽດພາຍໃນເມື່ອຢູ່ໃນ production environment ສຳລັບຂໍ້ຜິດພາດ non-operational.
      // ກຳນົດຂໍ້ຄວາມທີ່ຈະສົ່ງໃຫ້ client:
      // - ຖ້າ `config.NODE_ENV` ເປັນ 'development', ໃຫ້ໃຊ້ `message` ຈາກ error ນັ້ນ.
      // - ຖ້າເປັນສະພາບແວດລ້ອມອື່ນ (ເຊັ່ນ 'production'), ໃຫ້ໃຊ້ຂໍ້ຄວາມທົ່ວໄປເພື່ອປ້ອງກັນການເປີດເຜີຍຂໍ້ມູນພາຍໃນ.
      const responseMessage = config.NODE_ENV === 'development' ? message : 'An unexpected internal server error occurred.';
      // ສົ່ງ response JSON ກັບໄປຫາ client ໂດຍໃຊ້ `statusCode` (ເຊິ່ງອາດຈະເປັນ 500) ແລະ `responseMessage` ທີ່ກຽມໄວ້.
      res.status(statusCode).json({ status: 'error', statusCode, message: responseMessage });
  }
}; // ສິ້ນສຸດ function `errorHandler`.

