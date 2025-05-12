// src/middleware/otpRateLimiter.ts
// ນຳເຂົ້າ default export (ເຊິ່ງແມ່ນ function `rateLimit`) ຈາກ library 'express-rate-limit'.
// library ນີ້ໃຊ້ເພື່ອສ້າງ middleware ສຳລັບຈຳກັດຈຳນວນ requests ທີ່ເຂົ້າມາຫາ server
// ຈາກ IP address ຫຼື identifier ອື່ນໆ ໃນໄລຍະເວລາທີ່ກຳນົດ.
import rateLimit from 'express-rate-limit';

// ປະກາດ ແລະ export middleware function ຊື່ `otpRateLimiter`.
// middleware ນີ້ຖືກສ້າງຂຶ້ນໂດຍການເອີ້ນ function `rateLimit` ພ້ອມກັບ object ການຕັ້ງຄ່າ (configuration object).
export const otpRateLimiter = rateLimit({
  // ກຳນົດໄລຍະເວລາ (window) ທີ່ຈະນັບຈຳນວນ requests.
  // ຄ່າແມ່ນ 5 * 60 * 1000 milliseconds, ເຊິ່ງເທົ່າກັບ 5 ນາທີ.
  windowMs: 5 * 60 * 1000, // 5 minutes

  // ກຳນົດຈຳນວນ requests ສູງສຸດທີ່ອະນຸຍາດໃຫ້ເຮັດໄດ້ພາຍໃນ `windowMs`.
  // ໃນກໍລະນີນີ້, ຈຳກັດໃຫ້ແຕ່ລະ IP address (ຫຼື ເບີໂທລະສັບ, ຂຶ້ນກັບການຕັ້ງຄ່າເພີ່ມເຕີມ) ສາມາດຂໍ OTP ໄດ້ພຽງ 3 ຄັ້ງ ພາຍໃນ 5 ນາທີ.
  max: 3, // limit each IP or phone number to 3 OTP requests per windowMs

  // ກຳນົດ response message ທີ່ຈະສົ່ງກັບໄປຫາ client ເມື່ອມີການ request ເກີນຈຳນວນທີ່ກຳນົດ (`max`).
  message: {
    // ກຳນົດ HTTP status code ທີ່ຈະສົ່ງກັບ. 429 ໝາຍເຖິງ "Too Many Requests".
    status: 429,
    // ກຳນົດຂໍ້ຄວາມ error ທີ່ຈະສົ່ງກັບໃນ response body (ເປັນ JSON).
    error: 'Too many OTP requests. Please try again later.', // "ມີການຂໍ OTP ຫຼາຍເກີນໄປ. ກະລຸນາລອງໃໝ່ພາຍຫຼັງ."
  },

  // ກຳນົດໃຫ້ສົ່ງ response headers ຕາມມາດຕະຖານ `RateLimit-*` (ເຊັ່ນ RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset).
  // ການສົ່ງ headers ນີ້ຊ່ວຍໃຫ້ client ຮູ້ກ່ຽວກັບ rate limit ທີ່ຖືກນຳໃຊ້.
  standardHeaders: true,

  // ກຳນົດໃຫ້ *ບໍ່* ສົ່ງ response headers ແບບເກົ່າ `X-RateLimit-*`.
  legacyHeaders: false,
}); // ສິ້ນສຸດການເອີ້ນ function `rateLimit` ແລະ ການສ້າງ middleware.