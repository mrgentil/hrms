-- Add missing column advances_deducted to payslip table
ALTER TABLE `payslip` ADD COLUMN `advances_deducted` DECIMAL(10, 2) NULL DEFAULT 0.00 AFTER `bonuses_total`;
