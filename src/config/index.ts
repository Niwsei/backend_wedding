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

/* export interface Config {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: number;
    DB_HOST: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    DB_PORT: number;
    JWT_SECRET: string;
    LOG_LEVEL: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    // ... other properties ...
    REDIS_PASSWORD?: string;

    // Add test config properties
    TEST_ADMIN_EMAIL?: string;
    TEST_ADMIN_PASSWORD?: string;
    TEST_USER_EMAIL?: string;
    TEST_USER_PASSWORD?: string;
} */

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DB_HOST: z.string().min(1, "DB_HOST is required"), // เพิ่ม message ให้ชัดเจน
  DB_USER: z.string().min(1, "DB_USER is required"),
  DB_PASSWORD: z.string(), // Zod จะถือว่าเป็น required ถ้าไม่ใส่ .optional()
  DB_NAME: z.string().min(1, "DB_NAME is required"),
  DB_PORT: z.coerce.number().default(3306),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters long'),
  CORS_ORIGIN: z.string().optional(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // --- TWILIO --- (เอา Comment ออกถ้ายังใช้ หรือลบออกถ้าไม่ใช้แล้ว)
  /* TWILIO_ACCOUNT_SID: z.string().startsWith('AC', 'Invalid Twilio Account SID'),
  TWILIO_AUTH_TOKEN: z.string().min(1, 'Twilio Auth Token is required'),
  TWILIO_PHONE_NUMBER: z.string().min(1, 'Twilio Phone Number is required'), */

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  TEST_ADMIN_EMAIL: z.string().email().optional(),
  TEST_ADMIN_PASSWORD: z.string().min(6).optional(),
  TEST_USER_EMAIL: z.string().email().optional(),
  TEST_USER_PASSWORD: z.string().min(6).optional(),
  // ***** ไม่มี TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, TEST_USER_EMAIL, TEST_USER_PASSWORD ที่นี่ *****
});

let config: z.infer<typeof envSchema>;
let tempLogger = console; // ใช้ console.log ชั่วคราวก่อน logger พร้อม

try {
   config = envSchema.parse(process.env); // <-- จุดที่ Validate
   logger.info('Environment configuration loaded and validated successfully.');
} catch (error) {
   if (error instanceof z.ZodError) {
      logger.fatal({ errors: error.format() }, 'Environment variable validation failed!'); // <-- Log ที่คุณเห็น
   } else {
       logger.fatal({ error }, 'An unknown error occurred during environment variable parsing:');
   }
  process.exit(1); // ออกจากโปรแกรมถ้า Validation ไม่ผ่าน
}

try {
  
   config = envSchema.parse(process.env);
 
   console.log('Environment configuration loaded and validated successfully.');
} catch (error) {
   // ສະແດງຂໍ້ຄວາມ error ຮ້າຍແຮງອອກທາງ console.
   console.error('FATAL: Environment variable validation failed!');
   // ກວດສອບວ່າ error ທີ່ເກີດຂຶ້ນແມ່ນ instance ຂອງ `z.ZodError` ຫຼືບໍ່.
   if (error instanceof z.ZodError) {
      // ຖ້າແມ່ນ `ZodError`, ໃຫ້ໃຊ້ method `format()` ຂອງມັນ ເພື່ອສະແດງລາຍລະອຽດຂອງຂໍ້ຜິດພາດ
      // ໃນຮູບແບບທີ່ອ່ານງ່າຍ (ບອກວ່າ field ໃດຜິດພາດຍ້ອນຫຍັງ).
      logger.fatal({ errors: error.format() }, 'FATAL: Environment variable validation failed!');
   } else {
      // ຖ້າເປັນ error ປະເພດອື່ນ, ໃຫ້ສະແດງ object error ນັ້ນອອກທາງ console.
      logger.fatal({ error }, 'FATAL: An unknown error occurred during environment variable parsing:');
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
   decimalNumbers: true,
};



// ສ້າງ ແລະ export object `twilioConfig` ສະເພາະສຳລັບການຕັ້ງຄ່າ Twilio.
/* export const twilioConfig = {
   accountSid: config.TWILIO_ACCOUNT_SID, // Account SID
   authToken: config.TWILIO_AUTH_TOKEN,   // Auth Token
   phoneNumber: config.TWILIO_PHONE_NUMBER, // ເບີໂທ Twilio
}; */

// ສ້າງ ແລະ export object `redisConfig` ສະເພາະສຳລັບການຕັ້ງຄ່າ Redis.
export const redisConfig = {
   host: config.REDIS_HOST,         // ທີ່ຢູ່ server Redis
   port: config.REDIS_PORT,         // port Redis
   password: config.REDIS_PASSWORD, // ລະຫັດຜ່ານ Redis (ອາດຈະເປັນ undefined ຖ້າບໍ່ໄດ້ຕັ້ງ)
};