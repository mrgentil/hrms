-- Fix Schema Mismatches - Final Version

-- 1. Salary Advance: Rename payment_date to paid_at (if matched schema creation) or Add paid_at
-- We attempt to ADD it first. If it exists, it might error, but that's fine.
-- Using 'fully_repaid_at' as anchor since it definitely exists.
ALTER TABLE `salary_advance` ADD COLUMN `paid_at` DATETIME(3) NULL AFTER `fully_repaid_at`;

-- Now add the payment details which depend on paid_at's existence for ordering (if we used AFTER paid_at)
-- To be safe, we order them after paid_at (which we just added)
ALTER TABLE `salary_advance` ADD COLUMN `payment_method` VARCHAR(50) NULL AFTER `paid_at`;
ALTER TABLE `salary_advance` ADD COLUMN `payment_reference` VARCHAR(100) NULL AFTER `payment_method`;

-- 2. Benefit Catalog
ALTER TABLE `benefit_catalog` ADD COLUMN `value_percentage` DECIMAL(5, 2) NULL AFTER `value_amount`;

-- 3. Employee Benefit
ALTER TABLE `employee_benefit` ADD COLUMN `enrolled_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) AFTER `benefit_id`;
ALTER TABLE `employee_benefit` ADD COLUMN `notes` TEXT NULL AFTER `usage_count`;
