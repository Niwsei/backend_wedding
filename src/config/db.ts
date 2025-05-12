/* import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import { dbConfig } from './index';
import logger from '../utils/logger';

let pool: Pool;

try {
    const options: PoolOptions = {
        ...dbConfig,
        // Optional: Add timezone, charset if needed
        // timezone: '+00:00',
        // charset: 'utf8mb4'
    };
    pool = mysql.createPool(options);

    // Asynchronous connection test
    pool.getConnection()
        .then(connection => {
            logger.info('Database connected successfully!');
            connection.release();
        })
        .catch(err => {
            logger.error({ err }, 'Database initial connection failed:');
        });

} catch (error) {
    logger.error({ error }, 'FATAL: Failed to create database connection pool.');
    process.exit(1); // Exit if pool creation fails
}

export const closeDbPool = async (): Promise<void> => {
    if (pool) {
        try {
            await pool.end();
            logger.info('Database pool closed.');
        } catch (error) {
            logger.error({ error }, 'Error closing database pool.');
        }
    }
};

// Ensure pool is exported correctly
if (!pool) {
    logger.fatal('Database pool was not initialized!');
    process.exit(1);
}

export default pool; */


// ນຳເຂົ້າ default export (ໂຕຫຼັກ) ຈາກ library 'mysql2/promise' ແລະ ຕັ້ງຊື່ໃຫ້ມັນວ່າ `mysql`.
// ພ້ອມກັນນັ້ນ, ນຳເຂົ້າ type `Pool` (ເຊິ່ງໝາຍເຖິງ object ຂອງ connection pool)
// ແລະ `PoolOptions` (ເຊິ່ງໝາຍເຖິງ type ຂອງ object ການຕັ້ງຄ່າສຳລັບ pool)
// ຈາກ library ດຽວກັນ. `mysql2/promise` ເປັນ library ສຳລັບເຊື່ອມຕໍ່ MySQL ໃນ Node.js ແບບໃຊ້ Promise.
import mysql, { Pool, PoolOptions } from 'mysql2/promise';

// ນຳເຂົ້າ object `dbConfig` ຈາກ file `index` ທີ່ຢູ່ໃນ folder ດຽວກັນ (`./`).
// ຄາດວ່າ `dbConfig` ນີ້ຈະບັນຈຸຂໍ້ມູນການຕັ້ງຄ່າການເຊື່ອມຕໍ່ຖານຂໍ້ມູນ ເຊັ່ນ host, user, password, database name.
import { dbConfig } from './index';

// ນຳເຂົ້າ `logger` ຈາກ file `logger` ທີ່ຢູ່ໃນ folder `utils` ລະດັບເທິງໜຶ່ງຂັ້ນ (`../`).
// `logger` ນີ້ຈະຖືກໃຊ້ເພື່ອບັນທຶກຂໍ້ມູນ (log) ການເຮັດວຽກ ຫຼື ຂໍ້ຜິດພາດຕ່າງໆ.
import logger from '../utils/logger';

// ປະກາດໂຕແປຊື່ `pool` ໂດຍຍັງບໍ່ທັນກຳນົດຄ່າເທື່ອ (`let`).
// ລະບຸ type ຂອງໂຕແປນີ້ໃຫ້ເປັນ `Pool` (ເຊິ່ງໝາຍເຖິງ connection pool ທີ່ສ້າງຈາກ library `mysql2`).
// Connection pool ເປັນກົນໄກທີ່ສ້າງ ແລະ ຈັດການກຸ່ມຂອງການເຊື່ອມຕໍ່ຖານຂໍ້ມູນທີ່ກຽມພ້ອມໄວ້,
// ເພື່ອໃຫ້ແອັບພລິເຄຊັນສາມາດນຳໃຊ້ໄດ້ທັນທີ ເຮັດໃຫ້ປະສິດທິພາບດີຂຶ້ນ.
let pool: Pool;

// ເລີ່ມຕົ້ນ block `try` ເພື່ອດັກຈັບ (catch) ຂໍ້ຜິດພາດທີ່ອາດຈະເກີດຂຶ້ນ
// ໃນລະຫວ່າງການສ້າງ object ການຕັ້ງຄ່າ ຫຼື ການສ້າງ connection pool.
try {
    // ສ້າງ object `options` ເພື່ອກຳນົດຄ່າຕ່າງໆໃຫ້ກັບ connection pool.
    // ລະບຸ type ຂອງ `options` ໃຫ້ເປັນ `PoolOptions`.
    const options: PoolOptions = {
        // ໃຊ້ Spread syntax (`...`) ເພື່ອ copy ຄຸນສົມບັດທັງໝົດຈາກ object `dbConfig`
        // (ເຊັ່ນ: host, user, password, database) ເຂົ້າມາໃນ object `options` ນີ້.
        ...dbConfig,
        // Optional: ເພີ່ມການຕັ້ງຄ່າ timezone ຫຼື charset ຖ້າຕ້ອງການ.
        // ສ່ວນນີ້ຖືກ comment ໄວ້, ໝາຍຄວາມວ່າຍັງບໍ່ໄດ້ໃຊ້ງານຕອນນີ້.
        // timezone: '+00:00', // ກຳນົດ timezone ຂອງການເຊື່ອມຕໍ່
        // charset: 'utf8mb4' // ກຳນົດ character set
    };
    // ໃຊ້ function `createPool` ຈາກ `mysql` (ທີ່ເຮົານຳເຂົ້າມາ) ເພື່ອສ້າງ connection pool ຕົວຈິງ.
    // ສົ່ງ object `options` (ທີ່ບັນຈຸການຕັ້ງຄ່າ) ເຂົ້າໄປ.
    // ຜົນລັບ (ກໍຄື object ຂອງ pool) ຈະຖືກເກັບໄວ້ໃນໂຕແປ `pool` ທີ່ປະກາດໄວ້ກ່ອນໜ້ານີ້.
    pool = mysql.createPool(options);

    // ທົດສອບການເຊື່ອມຕໍ່ແບບ asynchronous (ບໍ່ລໍຖ້າ block code ອື່ນ) ທັນທີຫຼັງຈາກສ້າງ pool.
    // ເອີ້ນ `pool.getConnection()` ເຊິ່ງຈະສົ່ງຄືນ Promise ທີ່ເມື່ອສຳເລັດຈະໄດ້ object ການເຊື່ອມຕໍ່ (connection).
    pool.getConnection()
        // ໃຊ້ `.then()` ເພື່ອຈັດການກໍລະນີທີ່ຂໍ connection ສຳເລັດ.
        // `connection` ແມ່ນ object ຂອງການເຊື່ອມຕໍ່ທີ່ໄດ້ມາຈາກ pool.
        .then(connection => {
            // ບັນທຶກ (log) ຂໍ້ຄວາມລະດັບ info ວ່າການເຊື່ອມຕໍ່ຖານຂໍ້ມູນສຳເລັດ.
            logger.info('Database connected successfully!');
            // ຄືນ (release) connection ກັບຄືນສູ່ pool ເພື່ອໃຫ້ request ອື່ນສາມາດນຳໄປໃຊ້ໄດ້.
            // ສຳຄັນຫຼາຍ! ຖ້າບໍ່ release, connection ນັ້ນຈະຄ້າງຢູ່ ແລະ ບໍ່ສາມາດໃຊ້ງານໄດ້ອີກ.
            connection.release();
        })
        // ໃຊ້ `.catch()` ເພື່ອຈັດການກໍລະນີທີ່ຂໍ connection ລົ້ມເຫຼວ (ເກີດ error).
        // `err` ແມ່ນ object ຂອງຂໍ້ຜິດພາດທີ່ເກີດຂຶ້ນ.
        .catch(err => {
            // ບັນທຶກ (log) ຂໍ້ຜິດພາດລະດັບ error, ພ້ອມທັງ object ຂອງ error (`err`)
            // ແລະ ຂໍ້ຄວາມອະທິບາຍວ່າການທົດສອບເຊື່ອມຕໍ່ເບື້ອງຕົ້ນລົ້ມເຫຼວ.
            logger.error({ err }, 'Database initial connection failed:');
            // ເຖິງແມ່ນວ່າການທົດສອບເຊື່ອມຕໍ່ເບື້ອງຕົ້ນລົ້ມເຫຼວ, pool ກໍອາດຈະຍັງຖືກສ້າງສຳເລັດ
            // ດັ່ງນັ້ນ code ຈຶ່ງບໍ່ exit ທີ່ຈຸດນີ້, ແຕ່ປ່ອຍໃຫ້ code ດ້ານລຸ່ມເຮັດວຽກຕໍ່ໄປກ່ອນ.
        });

// ເລີ່ມຕົ້ນ block `catch` ເພື່ອດັກຈັບຂໍ້ຜິດພາດທີ່ເກີດຂຶ້ນ *ໃນລະຫວ່າງ* ການເຮັດວຽກໃນ block `try`
// (ເຊັ່ນ: `mysql.createPool(options)` ລົ້ມເຫຼວ ເນື່ອງຈາກການຕັ້ງຄ່າບໍ່ຖືກຕ້ອງ).
} catch (error) {
    // ບັນທຶກ (log) ຂໍ້ຜິດພາດລະດັບ error, ພ້ອມທັງ object ຂອງ error (`error`)
    // ແລະ ຂໍ້ຄວາມບອກວ່າ "FATAL: Failed to create database connection pool."
    // (ຂໍ້ຜິດພາດຮ້າຍແຮງ: ການສ້າງ connection pool ລົ້ມເຫຼວ).
    logger.error({ error }, 'FATAL: Failed to create database connection pool.');
    // ໃຊ້ `process.exit(1)` ເພື່ອສັ່ງໃຫ້ Node.js application ຢຸດການເຮັດວຽກທັນທີ.
    // ການສົ່ງຄ່າ `1` (ຫຼື ຕົວເລກອື່ນທີ່ບໍ່ແມ່ນ 0) ເປັນສັນຍານບອກວ່າໂປຣແກຣມຈົບລົງດ້ວຍຂໍ້ຜິດພາດ.
    // ການ exit ນີ້ຈຳເປັນ ເພາະຖ້າ pool ສ້າງບໍ່ໄດ້, ແອັບສ່ວນໃຫຍ່ກໍຈະເຮັດວຽກຕໍ່ໄປບໍ່ໄດ້.
    process.exit(1); // Exit if pool creation fails
}

// ປະກາດ ແລະ export function ແບບ asynchronous ຊື່ `closeDbPool`.
// Function ນີ້ບໍ່ຮັບ parameter ແລະ ສົ່ງຄືນ Promise ທີ່ເມື່ອສຳເລັດຈະບໍ່ມີຄ່າ (`void`).
// ໜ້າທີ່ຂອງມັນຄືການປິດ connection pool ຢ່າງຖືກຕ້ອງເມື່ອແອັບພລິເຄຊັນຕ້ອງການຢຸດເຮັດວຽກ.
export const closeDbPool = async (): Promise<void> => {
    // ກວດສອບກ່ອນວ່າ `pool` ມີຄ່າແລ້ວ (ໝາຍຄວາມວ່າຖືກສ້າງສຳເລັດກ່ອນໜ້ານີ້) ຫຼືບໍ່.
    if (pool) {
        // ເລີ່ມຕົ້ນ block `try` ເພື່ອດັກຈັບຂໍ້ຜິດພາດທີ່ອາດຈະເກີດຂຶ້ນໃນຂະນະທີ່ພະຍາຍາມປິດ pool.
        try {
            // ເອີ້ນ `pool.end()` ເຊິ່ງເປັນ function asynchronous (ສົ່ງຄືນ Promise)
            // ເພື່ອປິດ connection ທັງໝົດໃນ pool ຢ່າງລະບຽບ.
            // `await` ຈະລໍຖ້າຈົນກວ່າການປິດ pool ຈະສຳເລັດ.
            await pool.end();
            // ບັນທຶກ (log) ຂໍ້ຄວາມລະດັບ info ວ່າ database pool ຖືກປິດແລ້ວ.
            logger.info('Database pool closed.');
        // ເລີ່ມຕົ້ນ block `catch` ເພື່ອດັກຈັບຂໍ້ຜິດພາດທີ່ເກີດຂຶ້ນໃນຂະນະທີ່ກຳລັງປິດ pool.
        } catch (error) {
            // ບັນທຶກ (log) ຂໍ້ຜິດພາດລະດັບ error, ພ້ອມທັງ object ຂອງ error (`error`)
            // ແລະ ຂໍ້ຄວາມອະທິບາຍ.
            logger.error({ error }, 'Error closing database pool.');
        }
    }
};

// ກວດສອບໃຫ້ແນ່ໃຈວ່າ `pool` ຖືກ export ອອກໄປຢ່າງຖືກຕ້ອງ (ມີການສ້າງຂຶ້ນສຳເລັດ).
// ເຖິງແມ່ນວ່າຈະມີ `try...catch` ຢູ່ເທິງແລ້ວ, ການກວດສອບນີ້ເປັນການປ້ອງກັນເພີ່ມເຕີມ
// ໃນກໍລະນີທີ່ `pool` ບໍ່ໄດ້ຮັບການກຳນົດຄ່າດ້ວຍເຫດຜົນບາງຢ່າງທີ່ບໍ່ຄາດຄິດ.
if (!pool) {
    // ບັນທຶກ (log) ຂໍ້ຜິດພາດລະດັບ fatal (ຮ້າຍແຮງທີ່ສຸດ) ວ່າ pool ບໍ່ໄດ້ຖືກເລີ່ມຕົ້ນສ້າງ.
    logger.fatal('Database pool was not initialized!');
    // ສັ່ງໃຫ້ໂປຣແກຣມຢຸດເຮັດວຽກທັນທີ ເພາະບໍ່ມີ pool ໃຫ້ໃຊ້ງານ.
    process.exit(1);
}

// ສົ່ງອອກ (export) object `pool` ທີ່ສ້າງຂຶ້ນສຳເລັດແລ້ວ ເປັນ default export.
// ນີ້ໝາຍຄວາມວ່າ file ອື່ນໆທີ່ `import` file ນີ້ ສາມາດເຂົ້າເຖິງ connection pool ນີ້ໄດ້ໂດຍກົງ
// ເພື່ອນຳໄປໃຊ້ຂໍ connection ສຳລັບ query ຂໍ້ມູນຕໍ່ໄປ.
export default pool;