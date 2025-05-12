// ນຳເຂົ້າ default export (object `twilio`) ຈາກ library 'twilio'.
// library ນີ້ໃຊ້ເພື່ອຕິດຕໍ່ ແລະ ໃຊ້ງານບໍລິການຕ່າງໆຂອງ Twilio (ໃນກໍລະນີນີ້ຄືການສົ່ງ SMS).
import twilio from 'twilio';

// ນຳເຂົ້າ object `twilioConfig` ຈາກ file `config` ໃນລະດັບເທິງໜຶ່ງຂັ້ນ (`../`).
// `twilioConfig` ຄາດວ່າຈະບັນຈຸຂໍ້ມູນການຕັ້ງຄ່າທີ່ຈຳເປັນສຳລັບ Twilio,
// ເຊັ່ນ: `accountSid`, `authToken`, ແລະ `phoneNumber` (ເບີໂທ Twilio).
import { twilioConfig } from '../config';

// ນຳເຂົ້າ `logger` ຈາກ file `logger` ໃນ folder `utils`.
// ໃຊ້ເພື່ອບັນທຶກ (log) ຂໍ້ມູນການເຮັດວຽກ ຫຼື ຂໍ້ຜິດພາດຕ່າງໆທີ່ເກີດຂຶ້ນ.
import logger from '../utils/logger';

// ນຳເຂົ້າ class `ApiError` ຈາກ file `apiError` ໃນ folder `errors`.
// ນີ້ແມ່ນ custom error class ທີ່ຊ່ວຍສ້າງ object ຂໍ້ຜິດພາດທີ່ລະອຽດກວ່າສຳລັບ API,
// ເຊິ່ງສາມາດກຳນົດ status code ແລະ ຄຸນສົມບັດອື່ນໆໄດ້.
import ApiError from '../errors/apiError'; // ນຳເຂົ້າ ApiError

// ສ້າງ instance ຫຼື object ຂອງ Twilio client ໂດຍການເອີ້ນ function `twilio`
// ແລະ ສົ່ງ `accountSid` ແລະ `authToken` ຈາກ `twilioConfig` ເຂົ້າໄປ.
// object `client` ນີ້ຈະຖືກໃຊ້ເພື່ອເອີ້ນໃຊ້ API ຕ່າງໆຂອງ Twilio.
const client = twilio(twilioConfig.accountSid, twilioConfig.authToken);

// ປະກາດ ແລະ export function ແບບ asynchronous ຊື່ `sendOtpSms`.
// Function ນີ້ຮັບ parameter ສອງຕົວ: `phone_number` (ເບີໂທຜູ້ຮັບ, ເປັນ string)
// ແລະ `otpCode` (ລະຫັດ OTP, ເປັນ string).
// Function ນີ້ຈະສົ່ງຄືນ Promise ທີ່ເມື່ອສຳເລັດຈະໄດ້ຄ່າເປັນ `boolean` (true).
// ຖ້າລົ້ມເຫຼວ, ມັນຈະ throw error.
export const sendOtpSms = async (phone_number: string, otpCode: string): Promise<boolean> => {
    // ກວດສອບຮູບແບບຂອງ `phone_number` ແບບພື້ນຖານໂດຍໃຊ້ regular expression.
    // `/^\+?[1-9]\d{1,14}$/` ກວດເບິ່ງວ່າ:
    //   - ອາດຈະຂຶ້ນຕົ້ນດ້ວຍ '+' (`\+?`)
    //   - ຕາມດ້ວຍໂຕເລກທີ່ບໍ່ແມ່ນ 0 (`[1-9]`)
    //   - ຕາມດ້ວຍໂຕເລກ 1 ເຖິງ 14 ໂຕ (`\d{1,14}`)
    // (Comment ແນະນຳວ່າໃນແອັບຕົວຈິງຄວນໃຊ້ library ເຊັ່ນ `libphonenumber` ເພື່ອກວດສອບທີ່ລະອຽດກວ່າ).
    // `! ... .test(phone_number)`: ຖ້າເບີໂທ *ບໍ່* ກົງກັບຮູບແບບ, ເງື່ອນໄຂນີ້ຈະເປັນ true.
    if (!/^\+?[1-9]\d{1,14}$/.test(phone_number)) {
        // ບັນທຶກ (log) ຂໍ້ຜິດພາດລະດັບ error, ພ້ອມກັບເບີໂທທີ່ຜິດຮູບແບບ.
        logger.error({ phone_number }, 'ຮູບແບບເບີໂທລະສັບບໍ່ຖືກຕ້ອງສຳລັບ Twilio');
        // ໂຍນ (throw) `ApiError` ອອກໄປ, ພ້ອມລະບຸ HTTP status code ເປັນ 400 (Bad Request)
        // ແລະ ຂໍ້ຄວາມບອກວ່າຮູບແບບເບີໂທບໍ່ຖືກຕ້ອງ. ການ throw error ຈະຢຸດການເຮັດວຽກຂອງ function ນີ້.
        throw new ApiError(400, 'ຮູບແບບເບີໂທລະສັບທີ່ໃຫ້ມາບໍ່ຖືກຕ້ອງສຳລັບການສົ່ງ OTP.');
    }
    // ເລີ່ມຕົ້ນ block `try` ເພື່ອລອງເຮັດວຽກທີ່ອາດຈະເກີດຂໍ້ຜິດພາດໄດ້ (ຄືການສົ່ງ SMS ຜ່ານ Twilio).
    try {
        // ໃຊ້ object `client` ທີ່ສ້າງໄວ້ ເພື່ອເອີ້ນ method `messages.create` ຂອງ Twilio API
        // ເພື່ອສ້າງ ແລະ ສົ່ງຂໍ້ຄວາມ SMS.
        // `await` ໝາຍຄວາມວ່າຈະລໍຖ້າຈົນກວ່າການສົ່ງຂໍ້ຄວາມຜ່ານ API ຈະສຳເລັດ (ຫຼື ລົ້ມເຫຼວ).
        // ຜົນລັບ (ຂໍ້ມູນຂອງຂໍ້ຄວາມທີ່ສົ່ງສຳເລັດ) ຈະຖືກເກັບໄວ້ໃນໂຕແປ `message`.
        const message = await client.messages.create({
            // ກຳນົດເນື້ອໃນ (ຂໍ້ຄວາມ) ຂອງ SMS ທີ່ຈະສົ່ງ, ໂດຍມີການໃສ່ລະຫັດ `otpCode` ເຂົ້າໄປ.
            body: `ລະຫັດຢືນຢັນ Blissful Weddings ຂອງທ່ານແມ່ນ: ${otpCode}`,
            // ກຳນົດເບີໂທຜູ້ສົ່ງ, ເຊິ່ງເອົາມາຈາກ `twilioConfig.phoneNumber` (ເບີ Twilio ທີ່ຕັ້ງຄ່າໄວ້).
            from: twilioConfig.phoneNumber,
            // ກຳນົດເບີໂທຜູ້ຮັບ, ເຊິ່ງແມ່ນ `phone_number` ທີ່ຮັບເຂົ້າມາໃນ function.
            to: phone_number,
        });
        // ຖ້າການສົ່ງ SMS ສຳເລັດ, ບັນທຶກ (log) ຂໍ້ມູນລະດັບ info ວ່າສົ່ງສຳເລັດແລ້ວ
        // ພ້ອມທັງເບີໂທຜູ້ຮັບ ແລະ `message.sid` (ID ຂອງຂໍ້ຄວາມທີ່ Twilio ສ້າງຂຶ້ນ).
        logger.info(`OTP SMS ຖືກສົ່ງໄປຫາ ${phone_number}. SID: ${message.sid}`);
        // ສົ່ງຄ່າ `true` ກັບຄືນໄປ ເພື່ອບອກວ່າການສົ່ງ OTP SMS ສຳເລັດ.
        return true;
    // ເລີ່ມຕົ້ນ block `catch` ເຊິ່ງຈະເຮັດວຽກຖ້າມີຂໍ້ຜິດພາດເກີດຂຶ້ນໃນ block `try`
    // (ເຊັ່ນ: ເຊື່ອມຕໍ່ Twilio ບໍ່ໄດ້, credential ບໍ່ຖືກ, ເບີໂທຜິດ, ເງິນໝົດ, etc.).
    // `error: any` ຮັບ object ຂອງຂໍ້ຜິດພາດນັ້ນໄວ້ໃນໂຕແປ `error`.
    } catch (error: any) {
        // ບັນທຶກ (log) ຂໍ້ຜິດພາດລະດັບ error ທີ່ເກີດຂຶ້ນ, ພ້ອມທັງ object ຂອງ error (`err: error`)
        // ແລະ ເບີໂທທີ່ກ່ຽວຂ້ອງ (`phone_number`).
        logger.error({ err: error, phone_number }, `ສົ່ງ OTP SMS ບໍ່ສຳເລັດ`);
        // ໂຍນ (throw) `ApiError` ອອກໄປ, ເຊິ່ງຖືກອອກແບບມາສະເພາະສຳລັບ controller/handler ຈັດການຕໍ່ໄປ.
        // - `500`: HTTP status code (Internal Server Error).
        // - `Failed to send...`: ຂໍ້ຄວາມທີ່ເປັນມິດກັບຜູ້ໃຊ້ຫຼາຍຂຶ້ນ.
        // - `false`: ໝາຍເຖິງວ່ານີ້ເປັນ non-operational error (ຄວາມຜິດພາດຈາກ service ພາຍນອກ, ບໍ່ແມ່ນ logic ພາຍໃນ server ເອງ).
        throw new ApiError(500, `ສົ່ງລະຫັດຢືນຢັນໄປໃຫ້ ${phone_number} ບໍ່ສຳເລັດ. ກະລຸນາລອງໃໝ່ໃນພາຍຫຼັງ.`, false); // Non-operational
    }
// ສິ້ນສຸດການປະກາດ function `sendOtpSms`.
};