-- Création des enums
-- (Ces CREATE TYPE peuvent échouer si les types existent déjà, c'est normal)

-- Table salary_advance
CREATE TABLE IF NOT EXISTS `salary_advance` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAID', 'REPAYING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `needed_by_date` DATETIME(3) NULL,
  `repayment_months` INT NULL,
  `monthly_deduction` DECIMAL(10, 2) NULL,
  `total_repaid` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `repayment_start` DATETIME(3) NULL,
  `submitted_at` DATETIME(3) NULL,
  `reviewed_by` INT NULL,
  `reviewed_at` DATETIME(3) NULL,
  `reviewer_comment` TEXT NULL,
  `payment_date` DATETIME(3) NULL,
  `fully_repaid_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `salary_advance_user_id_idx` (`user_id`),
  INDEX `salary_advance_status_idx` (`status`),
  CONSTRAINT `salary_advance_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  CONSTRAINT `salary_advance_reviewed_by_fkey` FOREIGN KEY (`reviewed_by`) REFERENCES `user`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table advance_repayment
CREATE TABLE IF NOT EXISTS `advance_repayment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `advance_id` INT NOT NULL,
  `payslip_month` INT NOT NULL,
  `payslip_year` INT NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `deducted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `advance_repayment_advance_id_idx` (`advance_id`),
  CONSTRAINT `advance_repayment_advance_id_fkey` FOREIGN KEY (`advance_id`) REFERENCES `salary_advance`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table bonus
CREATE TABLE IF NOT EXISTS `bonus` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `bonus_type` ENUM('PERFORMANCE', 'ANNUAL', 'EXCEPTIONAL', 'PROJECT_COMPLETION', 'RETENTION', 'REFERRAL') NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `period` VARCHAR(50) NULL,
  `status` ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `created_by` INT NULL,
  `approved_by` INT NULL,
  `approved_at` DATETIME(3) NULL,
  `approver_comment` TEXT NULL,
  `payslip_id` INT NULL,
  `paid_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `bonus_user_id_idx` (`user_id`),
  INDEX `bonus_status_idx` (`status`),
  CONSTRAINT `bonus_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  CONSTRAINT `bonus_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE SET NULL,
  CONSTRAINT `bonus_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `user`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table benefit_catalog
CREATE TABLE IF NOT EXISTS `benefit_catalog` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `benefit_type` ENUM('HEALTH_INSURANCE', 'MEAL_VOUCHERS', 'TRANSPORT', 'PHONE', 'GYM', 'TRAINING', 'REMOTE_WORK', 'OTHER') NOT NULL,
  `value_type` ENUM('FIXED', 'PERCENTAGE') NOT NULL DEFAULT 'FIXED',
  `value_amount` DECIMAL(10, 2) NULL,
  `employer_contribution` DECIMAL(10, 2) NULL,
  `employee_contribution` DECIMAL(10, 2) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `requires_enrollment` BOOLEAN NOT NULL DEFAULT true,
  `eligibility_rules` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table employee_benefit
CREATE TABLE IF NOT EXISTS `employee_benefit` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `benefit_id` INT NOT NULL,
  `start_date` DATETIME(3) NOT NULL,
  `end_date` DATETIME(3) NULL,
  `status` ENUM('ACTIVE', 'SUSPENDED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
  `custom_value` DECIMAL(10, 2) NULL,
  `usage_count` INT NOT NULL DEFAULT 0,
  `last_used_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `employee_benefit_user_id_idx` (`user_id`),
  INDEX `employee_benefit_benefit_id_idx` (`benefit_id`),
  CONSTRAINT `employee_benefit_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_benefit_benefit_id_fkey` FOREIGN KEY (`benefit_id`) REFERENCES `benefit_catalog`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table payslip
CREATE TABLE IF NOT EXISTS `payslip` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `month` INT NOT NULL,
  `year` INT NOT NULL,
  `salary_basic` DECIMAL(10, 2) NOT NULL,
  `salary_gross` DECIMAL(10, 2) NOT NULL,
  `allowances_total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `allowances_breakdown` JSON NULL,
  `deductions_total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `deductions_breakdown` JSON NULL,
  `bonuses_total` DECIMAL(10, 2) NULL DEFAULT 0.00,
  `bonuses_breakdown` JSON NULL,
  `salary_net` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('DRAFT', 'PUBLISHED', 'SENT', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `pdf_path` VARCHAR(500) NULL,
  `generated_by` INT NULL,
  `generated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `published_at` DATETIME(3) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `payslip_user_month_year_unique` (`user_id`, `month`, `year`),
  INDEX `payslip_user_id_idx` (`user_id`),
  INDEX `payslip_status_idx` (`status`),
  CONSTRAINT `payslip_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  CONSTRAINT `payslip_generated_by_fkey` FOREIGN KEY (`generated_by`) REFERENCES `user`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;