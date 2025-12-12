-- Fix Remaining Columns
-- "submitted_at" caused an error because it's already there.
-- Assuming "payslip_month" and "payslip_year" were added just before the error.
-- This script adds ONLY the remaining tables that requested columns.

-- 1. SALARY ADVANCE TABLE
-- Check if you have "paid_at". If not, this adds it.
ALTER TABLE `salary_advance` ADD COLUMN `paid_at` DATETIME(3) NULL;
ALTER TABLE `salary_advance` ADD COLUMN `payment_method` VARCHAR(50) NULL;
ALTER TABLE `salary_advance` ADD COLUMN `payment_reference` VARCHAR(100) NULL;

-- 2. BENEFIT CATALOG TABLE
ALTER TABLE `benefit_catalog` ADD COLUMN `value_percentage` DECIMAL(5, 2) NULL;

-- 3. EMPLOYEE BENEFIT TABLE
ALTER TABLE `employee_benefit` ADD COLUMN `enrolled_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `employee_benefit` ADD COLUMN `notes` TEXT NULL;
