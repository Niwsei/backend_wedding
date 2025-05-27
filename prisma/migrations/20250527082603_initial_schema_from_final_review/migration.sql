-- CreateTable
CREATE TABLE `bookings` (
    `booking_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `service_id` INTEGER NULL,
    `package_id` INTEGER NULL,
    `booking_type` ENUM('Consultation', 'VenueVisit', 'TastingSession', 'WeddingEvent', 'PackageBooking', 'ServiceBooking', 'Other') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `booking_datetime` DATETIME(3) NOT NULL,
    `location_type` VARCHAR(50) NULL,
    `location_details` VARCHAR(1024) NULL,
    `status` ENUM('Pending', 'Confirmed', 'CancelledByUser', 'CancelledByAdmin', 'Completed', 'Rescheduled', 'PaymentPending') NOT NULL DEFAULT 'Pending',
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_booking_datetime`(`booking_datetime`),
    INDEX `idx_booking_status`(`status`),
    INDEX `bookings_user_id_idx`(`user_id`),
    INDEX `bookings_package_id_idx`(`package_id`),
    INDEX `bookings_service_id_idx`(`service_id`),
    PRIMARY KEY (`booking_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budgetcategories` (
    `category_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `budgetcategories_name_key`(`name`),
    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `event_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `event_datetime` DATETIME(3) NOT NULL,
    `location_name` VARCHAR(255) NOT NULL,
    `location_address` VARCHAR(1024) NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_event_datetime`(`event_datetime`),
    INDEX `idx_event_is_active`(`is_active`),
    PRIMARY KEY (`event_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `galleryitems` (
    `item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `image_url` VARCHAR(1024) NOT NULL,
    `video_url` VARCHAR(1024) NULL,
    `title` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `collection_tag` VARCHAR(100) NULL,
    `category` VARCHAR(100) NULL,
    `event_date` DATE NULL,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `uploaded_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_gallery_category`(`category`),
    INDEX `idx_gallery_event_date`(`event_date`),
    INDEX `idx_gallery_is_active`(`is_active`),
    INDEX `idx_gallery_is_featured`(`is_featured`),
    PRIMARY KEY (`item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `herobanners` (
    `banner_id` INTEGER NOT NULL AUTO_INCREMENT,
    `image_url` VARCHAR(1024) NOT NULL,
    `title` VARCHAR(255) NULL,
    `subtitle` VARCHAR(500) NULL,
    `button_text` VARCHAR(100) NULL,
    `button_link` VARCHAR(1024) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_herobanner_is_active`(`is_active`),
    INDEX `idx_herobanner_sort_order`(`sort_order`),
    PRIMARY KEY (`banner_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `packages` (
    `package_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `cover_image_url` VARCHAR(1024) NULL,
    `is_popular` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_package_is_active`(`is_active`),
    PRIMARY KEY (`package_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `packageservices` (
    `package_id` INTEGER NOT NULL,
    `service_id` INTEGER NOT NULL,

    INDEX `packageservices_service_id_idx`(`service_id`),
    PRIMARY KEY (`package_id`, `service_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servicefeatures` (
    `feature_id` INTEGER NOT NULL AUTO_INCREMENT,
    `service_id` INTEGER NOT NULL,
    `feature_name` VARCHAR(255) NOT NULL,

    INDEX `idx_feature_service_id`(`service_id`),
    PRIMARY KEY (`feature_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `service_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(100) NULL,
    `base_price` DECIMAL(10, 2) NULL,
    `cover_image_url` VARCHAR(1024) NULL,
    `icon_url` VARCHAR(1024) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_service_category`(`category`),
    INDEX `idx_service_is_active`(`is_active`),
    PRIMARY KEY (`service_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `specialoffers` (
    `offer_id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `icon_url` VARCHAR(1024) NULL,
    `discount_details` VARCHAR(255) NULL,
    `valid_from` DATE NULL,
    `valid_until` DATE NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_offer_is_active`(`is_active`),
    INDEX `idx_offer_valid_until`(`valid_until`),
    PRIMARY KEY (`offer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testimonials` (
    `testimonial_id` INTEGER NOT NULL AUTO_INCREMENT,
    `couple_name` VARCHAR(255) NOT NULL,
    `photo_url` VARCHAR(1024) NULL,
    `rating` INTEGER NOT NULL,
    `quote` TEXT NOT NULL,
    `wedding_date` DATE NULL,
    `is_approved` BOOLEAN NOT NULL DEFAULT false,
    `submitted_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_testimonial_is_approved`(`is_approved`),
    PRIMARY KEY (`testimonial_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `userbudgetentries` (
    `entry_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `spent_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `notes` TEXT NULL,
    `last_updated` DATETIME(3) NOT NULL,

    INDEX `userbudgetentries_category_id_idx`(`category_id`),
    UNIQUE INDEX `uk_user_category`(`user_id`, `category_id`),
    PRIMARY KEY (`entry_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(20) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(255) NULL,
    `avatar_url` VARCHAR(1024) NULL,
    `user_role` ENUM('client', 'admin') NOT NULL DEFAULT 'client',
    `wedding_date` DATE NULL,
    `planning_status` VARCHAR(100) NULL,
    `phone_verified_at` TIMESTAMP(0) NULL,
    `total_budget` DECIMAL(15, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_number_key`(`phone_number`),
    INDEX `idx_user_email`(`email`),
    INDEX `idx_user_phone_number`(`phone_number`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usersavedinspirations` (
    `user_id` INTEGER NOT NULL,
    `item_id` INTEGER NOT NULL,
    `saved_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `usersavedinspirations_item_id_idx`(`item_id`),
    PRIMARY KEY (`user_id`, `item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usertasks` (
    `task_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `due_description` VARCHAR(255) NULL,
    `due_date` DATE NULL,
    `is_completed` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_usertask_due_date`(`due_date`),
    INDEX `idx_usertask_is_completed`(`is_completed`),
    INDEX `usertasks_user_id_idx`(`user_id`),
    PRIMARY KEY (`task_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services`(`service_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`package_id`) REFERENCES `packages`(`package_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packageservices` ADD CONSTRAINT `packageservices_ibfk_1` FOREIGN KEY (`package_id`) REFERENCES `packages`(`package_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packageservices` ADD CONSTRAINT `packageservices_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services`(`service_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servicefeatures` ADD CONSTRAINT `servicefeatures_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services`(`service_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userbudgetentries` ADD CONSTRAINT `userbudgetentries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userbudgetentries` ADD CONSTRAINT `userbudgetentries_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `budgetcategories`(`category_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usersavedinspirations` ADD CONSTRAINT `usersavedinspirations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usersavedinspirations` ADD CONSTRAINT `usersavedinspirations_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `galleryitems`(`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usertasks` ADD CONSTRAINT `usertasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
