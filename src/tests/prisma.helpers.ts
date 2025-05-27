// src/tests/prisma.helpers.ts
import prisma from '../config/prisma'; // Import Prisma Client instance
import { hashPassword } from '../utils/password';
import { UserRole } from '@prisma/client'; // Prisma Client จะ generate Enums ให้
import logger from '../utils/logger'; // Import logger

export const createTestUserWithPrisma = async (data: {
    email: string;
    password?: string;
    fullName?: string;
    username?: string;
    role?: UserRole; // <-- ใช้ UserRole จาก @prisma/client
    // ... other fields ...
}) => {
     let hashedPasswordValue: string; 
    if (data.password) {
        // ***** แก้ไขตรงนี้: ดึงเฉพาะ .hash ออกมา *****
        const passwordResult = await hashPassword(data.password);
        hashedPasswordValue = passwordResult; // <--- ใช้ .hash
    } else {
        hashedPasswordValue = 'test_dummy_hashed_password'; // ค่า default ถ้าไม่ได้ส่ง password มา
    }
    try {
        return await prisma.user.create({
            data: {
                email: data.email,
                password_hash: hashedPasswordValue,
                full_name: data.fullName,
                username: data.username,
                user_role: data.role || UserRole.client, // ใช้ Enum จาก Prisma
                // phone_number: data.phoneNumber, // ถ้ามี field นี้
                // phone_verified_at: data.phoneVerifiedAt, // ถ้ามี
            },
        });
    } catch (error) {
        logger.error({ error, userData: data }, `Failed to create test user ${data.email} with Prisma`);
        throw error; // Re-throw to fail the test setup
    }
};







export const cleanupUserByEmailWithPrisma = async (email: string) => {
    try {
        // ตรวจสอบว่ามี user หรือไม่ก่อนลบ (optional, deleteMany จะไม่ error ถ้าไม่เจอ)
        // const user = await prisma.user.findUnique({ where: { email } });
        // if (user) {
        await prisma.user.deleteMany({ where: { email } });
        logger.debug({ email }, `Cleaned up user ${email} with Prisma`);
        // }
    } catch (error) {
        logger.error({ error, email }, `Error cleaning up user ${email} with Prisma:`);
        // ใน test environment, อาจจะไม่ต้อง throw error ซ้ำ ถ้าการลบไม่สำเร็จ
        // แต่ควรจะ log ไว้
    }
};








export const cleanupAllTestDataWithPrisma = async () => {
    logger.warn('Attempting to clean up ALL test data with Prisma...');
    // เรียงลำดับการลบจากตารางที่มี Foreign Key อ้างอิงไปหาตารางอื่นก่อน
    // หรือใช้ $transaction และกำหนด onDelete: Cascade ใน Prisma Schema ให้ถูกต้อง

    // ตัวอย่างลำดับ (อาจจะต้องปรับตาม Schema ของคุณ)
    // การใช้ $transaction จะดีกว่าถ้ามีหลาย delete operations
    try {
        await prisma.$transaction([
            // Level 3 dependencies (ขึ้นกับ User, Service, Package etc.)
            prisma.userSavedInspiration.deleteMany(),
            prisma.userBudgetEntry.deleteMany(),
            prisma.userTask.deleteMany(),
            // Level 2 dependencies
            prisma.booking.deleteMany(), // ถ้า Booking อ้างอิง User, Service, Package
            prisma.packageService.deleteMany(), // ตารางเชื่อม
            prisma.serviceFeature.deleteMany(), // ตารางเชื่อม

            // Level 1 main tables (ที่ไม่มี FK ชี้มาหาจากตารางที่ยังไม่ถูกลบ)
            // หรือถ้า FK มี onDelete: Cascade ก็ลบตารางหลักได้เลย
            prisma.galleryItem.deleteMany(), // สมมติว่า UserSavedInspiration อ้างอิงถึงมัน
            prisma.specialOffer.deleteMany(),
            prisma.testimonial.deleteMany(),
            prisma.event.deleteMany(),
            prisma.heroBanner.deleteMany(),
            prisma.package.deleteMany(), // ควรลบหลังจาก PackageService
            prisma.service.deleteMany(), // ควรลบหลังจาก PackageService, ServiceFeature
            prisma.budgetCategory.deleteMany(), // ถ้าไม่ต้องการให้ลบ ให้เอาออก
            prisma.user.deleteMany(), // ลบ User เป็นลำดับท้ายๆ
        ]);
        logger.info('All test data cleaned up successfully with Prisma transaction.');
    } catch (error) {
        logger.error({ error }, 'Error cleaning up all test data with Prisma:');
        // ใน CI อาจจะต้องการให้ Test Fail ถ้า Clean up ไม่สำเร็จ
        // throw error;
    }
};