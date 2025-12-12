-- Fix Missing Columns - Version 2
-- Run this script to add the missing columns causing 500 errors.

-- 1. BONUS TABLE (Fixing the "payslip_month" error)
ALTER TABLE `bonus` ADD COLUMN `payslip_month` INT NULL;
ALTER TABLE `bonus` ADD COLUMN `payslip_year` INT NULL;
ALTER TABLE `bonus` ADD COLUMN `submitted_at` DATETIME(3) NULL;

-- 2. SALARY ADVANCE TABLE (Fixing "paid_at" error)
ALTER TABLE `salary_advance` ADD COLUMN `paid_at` DATETIME(3) NULL;
ALTER TABLE `salary_advance` ADD COLUMN `payment_method` VARCHAR(50) NULL;
ALTER TABLE `salary_advance` ADD COLUMN `payment_reference` VARCHAR(100) NULL;

-- 3. BENEFIT TABLES (Preventing future errors)
ALTER TABLE `benefit_catalog` ADD COLUMN `value_percentage` DECIMAL(5, 2) NULL;
ALTER TABLE `employee_benefit` ADD COLUMN `enrolled_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `employee_benefit` ADD COLUMN `notes` TEXT NULL;
