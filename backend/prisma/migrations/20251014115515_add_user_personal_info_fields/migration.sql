-- AlterTable
ALTER TABLE `user_personal_info` ADD COLUMN `emergency_contact_primary_name` VARCHAR(255) NULL,
    ADD COLUMN `emergency_contact_primary_phone` VARCHAR(100) NULL,
    ADD COLUMN `emergency_contact_primary_relation` VARCHAR(255) NULL,
    ADD COLUMN `emergency_contact_secondary_name` VARCHAR(255) NULL,
    ADD COLUMN `emergency_contact_secondary_phone` VARCHAR(100) NULL,
    ADD COLUMN `emergency_contact_secondary_relation` VARCHAR(255) NULL,
    ADD COLUMN `spouse_name` VARCHAR(255) NULL;
