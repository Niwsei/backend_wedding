// ນຳເຂົ້າ default export ຈາກ library 'dotenv'.
// `dotenv` ເປັນ library ທີ່ໃຊ້ໂຫຼດໂຕແປສະພາບແວດລ້ອມ (environment variables)
// ຈາກ file `.env` ເຂົ້າມາໃນ `process.env` ຂອງ Node.js.
import dotenv from 'dotenv';

// ນຳເຂົ້າ default export ຈາກ module 'path' ຂອງ Node.js.
// `path` ເປັນ module ພື້ນຖານທີ່ຊ່ວຍໃນການເຮັດວຽກກັບເສັ້ນທາງ (path) ຂອງ file ແລະ directory
// ໃນລັກສະນະທີ່ເຂົ້າກັນໄດ້ກັບລະບົບປະຕິບັດການຕ່າງໆ.
import path from 'path';

// ນຳເຂົ້າ object `z` ຈາກ library 'zod'.
// `zod` ເປັນ library ສຳລັບການປະກາດໂຄງສ້າງຂໍ້ມູນ (schema) ແລະ ກວດສອບຄວາມຖືກຕ້ອງ (validation)
// ຂອງຂໍ້ມູນໃນ TypeScript/JavaScript, ເຮັດໃຫ້ແນ່ໃຈວ່າຂໍ້ມູນມີຮູບແບບ ແລະ ຄ່າທີ່ຖືກຕ້ອງຕາມກຳນົດ.
import { z } from 'zod';

// ນຳເຂົ້າ `logger` ຈາກ file `logger` ໃນ folder `utils` ລະດັບເທິງໜຶ່ງຂັ້ນ (`../`).
// ການນຳເຂົ້າ logger ໄວ້ກ່ອນ ເພື່ອສາມາດໃຊ້ບັນທຶກຂໍ້ຜິດພາດໄດ້ (ເຖິງແມ່ນວ່າໃນ code ຕໍ່ມາຈະໃຊ້ console.error ກ່ອນ).
import logger from '../utils/logger'; // Import logger early for logging errors

// ເອີ້ນ function `config` ຈາກ library `dotenv` ເພື່ອໂຫຼດໂຕແປຈາກ file `.env`.
// `path: path.resolve(__dirname, '../../.env')` ເປັນການກຳນົດເສັ້ນທາງໄປຫາ file `.env` ຢ່າງຊັດເຈນ:
//   - `__dirname`: ເປັນໂຕແປພິເສດໃນ Node.js ທີ່ໝາຍເຖິງເສັ້ນທາງເຕັມຂອງ directory ທີ່ file code ນີ້ຕັ້ງຢູ່.
//   - `../../.env`: ໝາຍເຖິງການຖອຍຫຼັງອອກໄປສອງລະດັບ directory ຈາກ `__dirname` ແລ້ວຊອກຫາ file ຊື່ `.env`.
//   - `path.resolve(...)`: ໃຊ້ function `resolve` ຈາກ module `path` ເພື່ອສ້າງເສັ້ນທາງທີ່ສົມບູນ (absolute path)
//     ໄປຫາ file `.env` ໂດຍອີງໃສ່ `__dirname` ແລະ ເສັ້ນທາງທີ່ກຳນົດ (relative path).
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ປະກາດ object schema ຊື່ `envSchema` ໂດຍໃຊ້ `zod`.
// Schema ນີ້ຈະກຳນົດໂຄງສ້າງ, ປະເພດຂໍ້ມູນ, ແລະ ເງື່ອນໄຂຄວາມຖືກຕ້ອງ
// ສຳລັບໂຕແປສະພາບແວດລ້ອມ (environment variables) ທີ່ແອັບພລິເຄຊັນຕ້ອງການ.
const envSchema = z.object({
   // ກຳນົດໂຕແປ `NODE_ENV`:
   //   - `z.enum(['development', 'production', 'test'])`: ຕ້ອງເປັນໜຶ່ງໃນສາມຄ່າ string ນີ້ເທົ່ານັ້ນ.
   //   - `.default('development')`: ຖ້າບໍ່ມີການກຳນົດ `NODE_ENV` ໃນ `.env`, ຈະໃຊ້ຄ່າ 'development' ເປັນຄ່າເລີ່ມຕົ້ນ.
   NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

   // ກຳນົດໂຕແປ `PORT`:
   //   - `z.coerce.number()`: ພະຍາຍາມແປງຄ່າທີ່ໄດ້ຮັບ (ເຊິ່ງມັກຈະເປັນ string ຈາກ process.env) ໃຫ້ເປັນ number.
   //   - `.positive()`: ຄ່າ number ນັ້ນຕ້ອງເປັນບວກ (ຫຼາຍກວ່າ 0).
   //   - `.default(3000)`: ຖ້າບໍ່ມີການກຳນົດ, ໃຊ້ຄ່າເລີ່ມຕົ້ນເປັນ 3000.
   PORT: z.coerce.number().positive().default(3000),

   // ກຳນົດໂຕແປ `DB_HOST` (ທີ່ຢູ່ຂອງ database server):
   //   - `z.string()`: ຕ້ອງເປັນ string.
   //   - `.min(1)`: ຕ້ອງມີຄວາມຍາວຢ່າງໜ້ອຍ 1 ໂຕອັກສອນ (ບໍ່ສາມາດເປັນ string ຫວ່າງເປົ່າ).
   DB_HOST: z.string().min(1),

   // ກຳນົດໂຕແປ `DB_USER` (ຊື່ຜູ້ໃຊ້ database):
   //   - `z.string().min(1)`: ຄືກັນກັບ `DB_HOST`.
   DB_USER: z.string().min(1),

   // ກຳນົດໂຕແປ `DB_PASSWORD` (ລະຫັດຜ່ານ database):
   //   - `z.string()`: ຕ້ອງເປັນ string (ອະນຸຍາດໃຫ້ເປັນ string ຫວ່າງເປົ່າໄດ້).
   DB_PASSWORD: z.string(),

   // ກຳນົດໂຕແປ `DB_NAME` (ຊື່ database):
   //   - `z.string().min(1)`: ຄືກັນກັບ `DB_HOST`.
   DB_NAME: z.string().min(1),

   // ກຳນົດໂຕແປ `DB_PORT` (port ຂອງ database server):
   //   - `z.coerce.number().positive().default(3306)`: ຄືກັນກັບ `PORT`, ແຕ່ default ເປັນ 3306 (port ມາດຕະຖານຂອງ MySQL).
   DB_PORT: z.coerce.number().positive().default(3306),

   // ກຳນົດໂຕແປ `JWT_SECRET` (ລະຫັດລັບສຳລັບ JSON Web Token):
   //   - `z.string().min(10, 'JWT_SECRET must be at least 10 characters long')`:
   //     ຕ້ອງເປັນ string ທີ່ມີຄວາມຍາວຢ່າງໜ້ອຍ 10 ໂຕອັກສອນ. ຖ້າບໍ່ຜ່ານ, ຈະສະແດງຂໍ້ຄວາມ error ທີ່ລະບຸໄວ້.
   JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters long'),

   // ກຳນົດໂຕແປ `TWILIO_ACCOUNT_SID` (Account SID ຂອງ Twilio):
   //   - `z.string().startsWith('AC', 'Invalid Twilio Account SID')`:
   //     ຕ້ອງເປັນ string ທີ່ຂຶ້ນຕົ້ນດ້ວຍ 'AC'. ຖ້າບໍ່ຜ່ານ, ຈະສະແດງຂໍ້ຄວາມ error ທີ່ລະບຸໄວ້.
   TWILIO_ACCOUNT_SID: z.string().startsWith('AC', 'Invalid Twilio Account SID'),

   // ກຳນົດໂຕແປ `TWILIO_AUTH_TOKEN` (Auth Token ຂອງ Twilio):
   //   - `z.string().min(1, 'Twilio Auth Token is required')`:
   //     ຕ້ອງເປັນ string ທີ່ບໍ່ຫວ່າງເປົ່າ.
   TWILIO_AUTH_TOKEN: z.string().min(1, 'Twilio Auth Token is required'),

   // ກຳນົດໂຕແປ `TWILIO_PHONE_NUMBER` (ເບີໂທ Twilio):
   //   - `z.string().min(1, 'Twilio Phone Number is required')`:
   //     ຕ້ອງເປັນ string ທີ່ບໍ່ຫວ່າງເປົ່າ. (Comment ແນະນຳວ່າຄວນມີການກວດສອບທີ່ເຂັ້ມງວດກວ່ານີ້, ເຊັ່ນ ຮູບແບບເບີໂທ).
   TWILIO_PHONE_NUMBER: z.string().min(1, 'Twilio Phone Number is required'), // Consider stricter validation

   // ກຳນົດໂຕແປ `REDIS_HOST` (ທີ່ຢູ່ຂອງ Redis server):
   //   - `z.string().default('localhost')`: ຕ້ອງເປັນ string, default ເປັນ 'localhost'.
   REDIS_HOST: z.string().default('localhost'),

   // ກຳນົດໂຕແປ `REDIS_PORT` (port ຂອງ Redis server):
   //   - `z.coerce.number().positive().default(6379)`: ຄືກັນກັບ `PORT`, ແຕ່ default ເປັນ 6379 (port ມາດຕະຖານຂອງ Redis).
   REDIS_PORT: z.coerce.number().positive().default(6379),

   // ກຳນົດໂຕແປ `REDIS_PASSWORD` (ລະຫັດຜ່ານ Redis):
   //   - `z.string().optional()`: ຕ້ອງເປັນ string, ແຕ່ບໍ່ຈຳເປັນຕ້ອງມີ (`optional`). ຖ້າບໍ່ມີ, ຄ່າຈະເປັນ `undefined`.
   REDIS_PASSWORD: z.string().optional(),

   // ກຳນົດໂຕແປ `CORS_ORIGIN` (URL ທີ່ອະນຸຍາດໃຫ້ເຂົ້າເຖິງ API ຜ່ານ CORS):
   //   - `z.string().url('CORS_ORIGIN must be a valid URL')`: ຕ້ອງເປັນ string ທີ່ເປັນຮູບແບບ URL ທີ່ຖືກຕ້ອງ. ຖ້າບໍ່ແມ່ນ, ສະແດງຂໍ້ຄວາມ error.
   //   - `.optional()`: ບໍ່ຈຳເປັນຕ້ອງມີ.
   CORS_ORIGIN: z.string().url('CORS_ORIGIN must be a valid URL').optional(), // Validate URL if present

   // ກຳນົດໂຕແປ `LOG_LEVEL` (ລະດັບການບັນທຶກ log):
   //   - `z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])`: ຕ້ອງເປັນໜຶ່ງໃນຄ່າ string ເຫຼົ່ານີ້.
   //   - `.default('info')`: ຖ້າບໍ່ມີການກຳນົດ, ໃຊ້ຄ່າ 'info' ເປັນຄ່າເລີ່ມຕົ້ນ.
   LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
}); // ສິ້ນສຸດການກຳນົດ schema.

// ປະກາດໂຕແປ `config` ໂດຍຍັງບໍ່ກຳນົດຄ່າ.
// `z.infer<typeof envSchema>` ເປັນການໃຊ້ Zod ເພື່ອສ້າງ TypeScript type ໂດຍອັດຕະໂນມັດ
// ຈາກ `envSchema` ທີ່ເຮົາກຳນົດໄວ້. ນີ້ຊ່ວຍໃຫ້ມີ type safety ເມື່ອເອີ້ນໃຊ້ຄ່າຕ່າງໆໃນ `config`.
let config: z.infer<typeof envSchema>;

// ເລີ່ມຕົ້ນ block `try` ເພື່ອດັກຈັບຂໍ້ຜິດພາດທີ່ອາດຈະເກີດຂຶ້ນໃນຂະນະທີ່ກວດສອບ environment variables.
try {
   // ໃຊ້ method `parse` ຂອງ `envSchema` ເພື່ອກວດສອບ object `process.env` (ເຊິ່ງບັນຈຸ environment variables ທັງໝົດ)
   // ທຽບກັບ schema ທີ່ກຳນົດໄວ້.
   //   - ຖ້າ `process.env` ຖືກຕ້ອງຕາມ `envSchema` (ລວມທັງການແປງ type ແລະ ໃຊ້ຄ່າ default),
   //     `parse` ຈະສົ່ງຄືນ object ທີ່ມີ type ຖືກຕ້ອງ ແລະ ຄ່າທີ່ກວດສອບແລ້ວ, ເຊິ່ງຈະຖືກເກັບໄວ້ໃນໂຕແປ `config`.
   //   - ຖ້າ `process.env` ບໍ່ຖືກຕ້ອງຕາມ `envSchema`, `parse` ຈະ throw error (ຊະນິດ `z.ZodError`).
   config = envSchema.parse(process.env);
   // logger.info('Environment configuration loaded and validated.'); // Comment ນີ້ບອກວ່າ logger ອາດຈະຍັງບໍ່ພ້ອມເຕັມທີ່ໃນຈຸດນີ້ ຂຶ້ນກັບລຳດັບການໂຫຼດ.
   // ໃຊ້ `console.log` ແທນ ເພື່ອໃຫ້ມີ feedback ທັນທີວ່າການໂຫຼດ ແລະ ກວດສອບ config ສຳເລັດ.
   console.log('Environment configuration loaded and validated successfully.'); // Use console here for early feedback
// ເລີ່ມຕົ້ນ block `catch` ເຊິ່ງຈະເຮັດວຽກຖ້າ `envSchema.parse(process.env)` ເກີດ error.
} catch (error) {
   // ສະແດງຂໍ້ຄວາມ error ຮ້າຍແຮງອອກທາງ console.
   console.error('FATAL: Environment variable validation failed!');
   // ກວດສອບວ່າ error ທີ່ເກີດຂຶ້ນແມ່ນ instance ຂອງ `z.ZodError` ຫຼືບໍ່.
   if (error instanceof z.ZodError) {
      // ຖ້າແມ່ນ `ZodError`, ໃຫ້ໃຊ້ method `format()` ຂອງມັນ ເພື່ອສະແດງລາຍລະອຽດຂອງຂໍ້ຜິດພາດ
      // ໃນຮູບແບບທີ່ອ່ານງ່າຍ (ບອກວ່າ field ໃດຜິດພາດຍ້ອນຫຍັງ).
      console.error(error.format());
   } else {
      // ຖ້າເປັນ error ປະເພດອື່ນ, ໃຫ້ສະແດງ object error ນັ້ນອອກທາງ console.
      console.error(error);
   }
   // ໃຊ້ `process.exit(1)` ເພື່ອສັ່ງໃຫ້ Node.js application ຢຸດການເຮັດວຽກທັນທີ
   // ເນື່ອງຈາກ environment variables ທີ່ຈຳເປັນບໍ່ຖືກຕ້ອງ, ແອັບບໍ່ຄວນເຮັດວຽກຕໍ່ໄປ.
   process.exit(1);
}

// ສົ່ງອອກ (export) object `config` (ທີ່ບັນຈຸ environment variables ທີ່ຜ່ານການກວດສອບແລ້ວ)
// ເປັນ default export ຂອງ module ນີ້. file ອື່ນໆທີ່ import module ນີ້ ສາມາດເຂົ້າເຖິງ config ນີ້ໄດ້.
export default config;

// ສ້າງ ແລະ export object `dbConfig` ສະເພາະສຳລັບການຕັ້ງຄ່າ database pool.
// ຄ່າຕ່າງໆຖືກດຶງມາຈາກ object `config` ຫຼັກທີ່ຜ່ານການກວດສອບແລ້ວ.
export const dbConfig = {
   host: config.DB_HOST,       // ທີ່ຢູ່ server
   user: config.DB_USER,       // ຊື່ຜູ້ໃຊ້
   password: config.DB_PASSWORD, // ລະຫັດຜ່ານ
   database: config.DB_NAME,   // ຊື່ database
   port: config.DB_PORT,         // port
   waitForConnections: true,     // ຕັ້ງຄ່າ pool: ລໍຖ້າ connection ຖ້າບໍ່ມີໂຕວ່າງ
   connectionLimit: 10,          // ຕັ້ງຄ່າ pool: ຈຳນວນ connection ສູງສຸດໃນ pool
   queueLimit: 0,                // ຕັ້ງຄ່າ pool: ຈຳນວນ request ສູງສຸດທີ່ລໍຖ້າ connection (0 = ບໍ່ຈຳກັດ)
};

// ສ້າງ ແລະ export object `twilioConfig` ສະເພາະສຳລັບການຕັ້ງຄ່າ Twilio.
export const twilioConfig = {
   accountSid: config.TWILIO_ACCOUNT_SID, // Account SID
   authToken: config.TWILIO_AUTH_TOKEN,   // Auth Token
   phoneNumber: config.TWILIO_PHONE_NUMBER, // ເບີໂທ Twilio
};

// ສ້າງ ແລະ export object `redisConfig` ສະເພາະສຳລັບການຕັ້ງຄ່າ Redis.
export const redisConfig = {
   host: config.REDIS_HOST,         // ທີ່ຢູ່ server Redis
   port: config.REDIS_PORT,         // port Redis
   password: config.REDIS_PASSWORD, // ລະຫັດຜ່ານ Redis (ອາດຈະເປັນ undefined ຖ້າບໍ່ໄດ້ຕັ້ງ)
};