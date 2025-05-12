// ນຳເຂົ້າ default export (class `Redis`) ແລະ type `RedisOptions` ຈາກ library 'ioredis'.
// `ioredis` ເປັນ library ຍອດນິຍົມສຳລັບເຊື່ອມຕໍ່ ແລະ ຕິດຕໍ່ກັບ Redis server ໃນ Node.js.
import Redis, { RedisOptions } from 'ioredis';

// ນຳເຂົ້າ object `redisConfig` ຈາກ file `index` ທີ່ຢູ່ໃນ folder ດຽວກັນ (`./`).
// `redisConfig` ນີ້ຈະບັນຈຸຂໍ້ມູນການຕັ້ງຄ່າການເຊື່ອມຕໍ່ Redis ເຊັ່ນ: host, port, password.
import { redisConfig } from './index';

// ນຳເຂົ້າ `logger` ຈາກ file `logger` ທີ່ຢູ່ໃນ folder `utils` ລະດັບເທິງໜຶ່ງຂັ້ນ (`../`).
// `logger` ຈະຖືກໃຊ້ເພື່ອບັນທຶກຂໍ້ມູນ (log) ການເຮັດວຽກ ຫຼື ຂໍ້ຜິດພາດທີ່ກ່ຽວຂ້ອງກັບ Redis.
import logger from '../utils/logger';

// ປະກາດໂຕແປຊື່ `redisClient` ໂດຍຍັງບໍ່ທັນກຳນົດຄ່າເທື່ອ (`let`).
// ລະບຸ type ຂອງໂຕແປນີ້ໃຫ້ເປັນ `Redis` (ໝາຍເຖິງ instance ຂອງ ioredis client).
let redisClient: Redis;

// ເລີ່ມຕົ້ນ block `try` ເພື່ອດັກຈັບ (catch) ຂໍ້ຜິດພາດທີ່ອາດຈະເກີດຂຶ້ນ
// ໃນລະຫວ່າງການສ້າງ object ການຕັ້ງຄ່າ ຫຼື ການສ້າງ Redis client instance.
try {
    // ສ້າງ object `options` ເພື່ອກຳນົດຄ່າຕ່າງໆໃຫ້ກັບ Redis client.
    // ລະບຸ type ຂອງ `options` ໃຫ້ເປັນ `RedisOptions`.
    const options: RedisOptions = {
        // ກຳນົດ host (ທີ່ຢູ່) ຂອງ Redis server ໂດຍເອົາຄ່າมาจาก `redisConfig.host`.
        host: redisConfig.host,
        // ກຳນົດ port ຂອງ Redis server ໂດຍເອົາຄ່າมาจาก `redisConfig.port`.
        port: redisConfig.port,
        // ກຳນົດ password ສຳລັບການເຊື່ອມຕໍ່ Redis (ຖ້າມີ) ໂດຍເອົາຄ່າมาจาก `redisConfig.password`.
        // ຖ້າ `redisConfig.password` ເປັນ `undefined`, `ioredis` ຈະບໍ່ໃຊ້ password.
        password: redisConfig.password,
        // ກຳນົດຈຳນວນສູງສຸດໃນການລອງໃໝ່ສຳລັບແຕ່ລະ request (ຄຳສັ່ງ) ທີ່ສົ່ງໄປ Redis ເປັນ 3 ຄັ້ງ.
        // ໝາຍເຫດ: ອັນນີ້ຕ່າງຈາກ `retryStrategy` ທີ່ໃຊ້ສຳລັບການ *ເຊື່ອມຕໍ່* ໃໝ່.
        maxRetriesPerRequest: 3,
        // ກຳນົດໃຫ້ `ioredis` ກວດສອບວ່າ Redis server ພ້ອມຮັບຄຳສັ່ງແລ້ວ ຫຼື ບໍ່ ກ່ອນຈະສົ່ງ event 'ready'.
        enableReadyCheck: true, // Check if server is ready

        // Optional: ເພີ່ມ retry strategy (ຍຸດທະສາດການລອງເຊື່ອມຕໍ່ໃໝ່), TLS options (ສຳລັບການເຊື່ອມຕໍ່ທີ່ປອດໄພ) ແລະ ອື່ນໆ.
        // ກຳນົດ function `retryStrategy` ເອງ ເພື່ອຄວບຄຸມວິທີການລອງເຊື່ອມຕໍ່ໃໝ່ເມື່ອການເຊື່ອມຕໍ່ລົ້ມເຫຼວ.
        // function ນີ້ຈະຖືກເອີ້ນດ້ວຍຈຳນວນຄັ້ງທີ່ພະຍາຍາມລອງໃໝ່ແລ້ວ (`times`).
        retryStrategy(times) {
            // ຄຳນວນໄລຍະເວລາລໍຖ້າ (delay) ກ່ອນຈະລອງເຊື່ອມຕໍ່ໃໝ່ຄັ້ງຕໍ່ໄປ.
            // ໃຊ້ວິທີ Exponential Backoff ແບບງ່າຍ: ເອົາ `times` ຄູນ 50 milliseconds,
            // ແຕ່ບໍ່ໃຫ້ເກີນ 2000 milliseconds (2 ວິນາທີ).
            const delay = Math.min(times * 50, 2000); // Exponential backoff
            // ບັນທຶກ (log) ຂໍ້ຄວາມເຕືອນວ່າກຳລັງລອງເຊື່ອມຕໍ່ Redis ໃໝ່, ພ້ອມບອກຄັ້ງທີ່ລອງ ແລະ ເວລາ delay.
            logger.warn(`Redis retrying connection (attempt ${times}), delay ${delay}ms`);
            // ສົ່ງຄ່າ delay (ໃນໜ່ວຍ milliseconds) ກັບຄືນໄປ. `ioredis` ຈະໃຊ້ຄ່ານີ້ເພື່ອລໍຖ້າກ່ອນລອງໃໝ່.
            return delay;
        },
    };
    // ສ້າງ instance ໃໝ່ຂອງ Redis client ໂດຍໃຊ້ class `Redis` (ທີ່ import ມາ)
    // ແລະ ສົ່ງ object `options` (ທີ່ບັນຈຸການຕັ້ງຄ່າ) ເຂົ້າໄປ.
    // instance ທີ່ສ້າງຂຶ້ນຈະຖືກເກັບໄວ້ໃນໂຕແປ `redisClient`.
    redisClient = new Redis(options);

    // ຕັ້ງໂຕຮັບຟັງເຫດການ (event listeners) ຕ່າງໆທີ່ອາດຈະເກີດຂຶ້ນກັບ `redisClient`.
    // ເມື່ອເຫດການ 'connect' ເກີດຂຶ້ນ (ໝາຍຄວາມວ່າເຊື່ອມຕໍ່ TCP ສຳເລັດ), ໃຫ້ log ຂໍ້ຄວາມ info.
    redisClient.on('connect', () => logger.info('Redis connected successfully!'));
    // ເມື່ອເຫດການ 'ready' ເກີດຂຶ້ນ (ໝາຍຄວາມວ່າ client ພ້ອມຮັບຄຳສັ່ງ), ໃຫ້ log ຂໍ້ຄວາມ info.
    redisClient.on('ready', () => logger.info('Redis client is ready.'));
    // ເມື່ອເຫດການ 'error' ເກີດຂຶ້ນ (ເຊັ່ນ: ເຊື່ອມຕໍ່ບໍ່ໄດ້, ຄຳສັ່ງຜິດພາດ), ໃຫ້ log ຂໍ້ຄວາມ error ພ້ອມ object ຂອງ error (`err`).
    redisClient.on('error', (err) => logger.error({ err }, 'Redis connection error:'));
    // ເມື່ອເຫດການ 'close' ເກີດຂຶ້ນ (ການເຊື່ອມຕໍ່ຖືກປິດລົງ), ໃຫ້ log ຂໍ້ຄວາມ info.
    redisClient.on('close', () => logger.info('Redis connection closed.'));
    // ເມື່ອເຫດການ 'reconnecting' ເກີດຂຶ້ນ (client ກຳລັງພະຍາຍາມເຊື່ອມຕໍ່ໃໝ່ຕາມ `retryStrategy`), ໃຫ້ log ຂໍ້ຄວາມ warn.
    redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));
    // ເມື່ອເຫດການ 'end' ເກີດຂຶ້ນ (ການເຊື່ອມຕໍ່ສິ້ນສຸດລົງຖາວອນ, ອາດຈະຍ້ອນລອງເຊື່ອມຕໍ່ໃໝ່ບໍ່ສຳເລັດ), ໃຫ້ log ຂໍ້ຄວາມ warn.
    redisClient.on('end', () => logger.warn('Redis connection ended (possibly due to failed retries).'));

// ເລີ່ມຕົ້ນ block `catch` ເພື່ອດັກຈັບຂໍ້ຜິດພາດທີ່ເກີດຂຶ້ນ *ໃນລະຫວ່າງ* ການເຮັດວຽກໃນ block `try`
// (ເຊັ່ນ: `new Redis(options)` ລົ້ມເຫຼວ ເນື່ອງຈາກການຕັ້ງຄ່າບໍ່ຖືກຕ້ອງ).
} catch (error) {
    // ບັນທຶກ (log) ຂໍ້ຜິດພາດລະດັບ error, ພ້ອມທັງ object ຂອງ error (`error`)
    // ແລະ ຂໍ້ຄວາມບອກວ່າ "FATAL: Failed to create Redis client instance."
    // (ຂໍ້ຜິດພາດຮ້າຍແຮງ: ການສ້າງ Redis client instance ລົ້ມເຫຼວ).
    logger.error({ error }, 'FATAL: Failed to create Redis client instance.');
    // ໃຊ້ `process.exit(1)` ເພື່ອສັ່ງໃຫ້ Node.js application ຢຸດການເຮັດວຽກທັນທີ.
    // ເພາະຖ້າ Redis client ສ້າງບໍ່ໄດ້, ແອັບອາດຈະເຮັດວຽກຕໍ່ໄປບໍ່ໄດ້.
    process.exit(1);
}

// ປະກາດ ແລະ export function ແບບ asynchronous ຊື່ `closeRedisConnection`.
// Function ນີ້ບໍ່ຮັບ parameter ແລະ ສົ່ງຄືນ Promise ທີ່ເມື່ອສຳເລັດຈະບໍ່ມີຄ່າ (`void`).
// ໜ້າທີ່ຂອງມັນຄືການປິດການເຊື່ອມຕໍ່ Redis ຢ່າງຖືກຕ້ອງເມື່ອແອັບພລິເຄຊັນຕ້ອງການຢຸດເຮັດວຽກ.
export const closeRedisConnection = async (): Promise<void> => {
    // ກວດສອບກ່ອນວ່າ `redisClient` ມີຄ່າແລ້ວ (ຖືກສ້າງສຳເລັດ)
    // ແລະ ສະຖານະ (status) ຂອງມັນບໍ່ແມ່ນ 'end' (ໝາຍຄວາມວ່າຍັງບໍ່ໄດ້ຖືກປິດຖາວອນ).
    if (redisClient && redisClient.status !== 'end') {
        // ເລີ່ມຕົ້ນ block `try` ເພື່ອດັກຈັບຂໍ້ຜິດພາດທີ່ອາດຈະເກີດຂຶ້ນໃນຂະນະທີ່ພະຍາຍາມປິດ connection.
        try {
            // ເອີ້ນ `redisClient.quit()` ເຊິ່ງເປັນ function asynchronous (ສົ່ງຄືນ Promise).
            // `quit()` ຈະສົ່ງຄຳສັ່ງ QUIT ໄປຍັງ Redis server, ລໍຖ້າໃຫ້ຄຳສັ່ງທີ່ຄ້າງຢູ່ຕອບກັບມາໃຫ້ໝົດ,
            // ແລ້ວຈຶ່ງປິດການເຊື່ອມຕໍ່ TCP.
            // `await` ຈະລໍຖ້າຈົນກວ່າການ `quit` ຈະສຳເລັດ.
            await redisClient.quit();
            // logger.info('Redis connection quit successfully.'); // Comment ນີ້ບອກວ່າບໍ່ຈຳເປັນຕ້ອງ log ທີ່ນີ້ ເພາະ event 'close' ຫຼື 'end' ຈະຖືກ log ຢູ່ແລ້ວ.
        // ເລີ່ມຕົ້ນ block `catch` ເພື່ອດັກຈັບຂໍ້ຜິດພາດທີ່ເກີດຂຶ້ນໃນຂະນະທີ່ກຳລັງ `quit`.
        } catch (error) {
            // ບັນທຶກ (log) ຂໍ້ຜິດພາດລະດັບ error, ພ້ອມທັງ object ຂອງ error (`error`)
            // ແລະ ຂໍ້ຄວາມອະທິບາຍ.
            logger.error({ error }, 'Error quitting Redis connection:');
        }
    // ຖ້າ `redisClient` ບໍ່ມີຄ່າ ຫຼື ສະຖານະເປັນ 'end' ແລ້ວ
    } else {
         // ບັນທຶກ (log) ຂໍ້ຄວາມເຕືອນວ່າ Redis client ບໍ່ໄດ້ເຊື່ອມຕໍ່ ຫຼື ຖືກປິດໄປແລ້ວ, ຈຶ່ງຂ້າມການ `quit`.
         logger.warn('Redis client not connected or already ended, skipping quit.');
    }
};

// ກວດສອບໃຫ້ແນ່ໃຈອີກຄັ້ງວ່າ `redisClient` ໄດ້ຖືກສ້າງຂຶ້ນສຳເລັດແລ້ວ.
// ເຖິງແມ່ນວ່າຈະມີ `try...catch` ຢູ່ເທິງແລ້ວ, ການກວດສອບນີ້ເປັນການປ້ອງກັນເພີ່ມເຕີມ
// ໃນກໍລະນີທີ່ `redisClient` ບໍ່ໄດ້ຮັບການກຳນົດຄ່າດ້ວຍເຫດຜົນບາງຢ່າງ.
if (!redisClient) {
    // ບັນທຶກ (log) ຂໍ້ຜິດພາດລະດັບ fatal (ຮ້າຍແຮງທີ່ສຸດ) ວ່າ Redis client ບໍ່ໄດ້ຖືກເລີ່ມຕົ້ນສ້າງ.
    logger.fatal('Redis client was not initialized!');
    // ສັ່ງໃຫ້ໂປຣແກຣມຢຸດເຮັດວຽກທັນທີ ເພາະບໍ່ມີ Redis client ໃຫ້ໃຊ້ງານ.
    process.exit(1);
}

// ສົ່ງອອກ (export) object `redisClient` ທີ່ສ້າງຂຶ້ນສຳເລັດແລ້ວ ເປັນ default export.
// ນີ້ໝາຍຄວາມວ່າ file ອື່ນໆທີ່ `import` file ນີ້ ສາມາດເຂົ້າເຖິງ Redis client ນີ້ໄດ້ໂດຍກົງ
// ເພື່ອນຳໄປໃຊ້ສົ່ງຄຳສັ່ງຕ່າງໆໄປຍັງ Redis server.
export default redisClient;