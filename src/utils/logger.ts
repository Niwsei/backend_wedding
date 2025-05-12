// บรรทัดที่ 1: นำเข้าฟังก์ชันหลัก `pino` จากไลบรารี pino สำหรับสร้าง Logger
import pino from 'pino';

// บรรทัดที่ 2: นำเข้าอ็อบเจกต์ `config` จากไฟล์ ../config เพื่อเข้าถึงค่า LOG_LEVEL และ NODE_ENV
import config from '../config'; // Import config เพื่อใช้ LOG_LEVEL และ NODE_ENV

// บรรทัดที่ 4: สร้างอินสแตนซ์ Logger ด้วยการเรียก pino() พร้อมส่งอ็อบเจกต์การตั้งค่า
const logger = pino({
  // บรรทัดที่ 5: กำหนด transport โดยเช็คว่าใช่ Production หรือไม่
  transport: config.NODE_ENV !== 'production'
    // บรรทัดที่ 6: ถ้าไม่ใช่ Production: ใช้ pino-pretty เพื่อทำให้ Log สวยงาม, มีสี, แปลงเวลา, และซ่อน pid/hostname
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' } }
    // บรรทัดที่ 7: ถ้าใช่ Production: ไม่ใช้ transport พิเศษ (ใช้ default คือ JSON output)
    : undefined,
  // บรรทัดที่ 8: ตั้งค่าระดับ Log ขั้นต่ำที่จะแสดง โดยอ่านค่าจาก config.LOG_LEVEL
  level: config.LOG_LEVEL,
  // บรรทัดที่ 9: กำหนดค่า base fields โดยไม่เอา pid (Process ID) ใส่ใน Log record
  base: { pid: false }, // เอา process id ออกถ้าไม่ต้องการ
  // บรรทัดที่ 10: กำหนดให้สร้าง timestamp ในรูปแบบมาตรฐาน ISO 8601
  timestamp: pino.stdTimeFunctions.isoTime,
// บรรทัดที่ 11: ปิดอ็อบเจกต์การตั้งค่า
});

// บรรทัดที่ 13: ส่งออก (export) อินสแตนซ์ `logger` ที่ตั้งค่าแล้ว เพื่อให้ไฟล์อื่นนำไปใช้ได้
export default logger;