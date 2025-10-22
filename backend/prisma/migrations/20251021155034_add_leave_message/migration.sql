-- Alter existing application types to match new enum values
UPDATE application SET type = "Congé Payé" WHERE type = "CongePaye";
UPDATE application SET type = "TéléTravail" WHERE type = "TeleTravail";
UPDATE application SET type = "Déménagement" WHERE type = "Demenagement";
UPDATE application SET type = "Décès" WHERE type = "Deces";

-- Update enum definition and add leave message table
ALTER TABLE `application` MODIFY `type` ENUM('Congé Payé', 'Maladie', 'TéléTravail', 'Marriage', 'Permission', 'Abscence', 'Déménagement', 'Décès') NOT NULL;

CREATE TABLE `leave_message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `application_id` INTEGER NOT NULL,
    `author_user_id` INTEGER NOT NULL,
    `message` TEXT NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `leave_message_application_id`(`application_id`),
    INDEX `leave_message_author_user_id`(`author_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `leave_message` ADD CONSTRAINT `leave_message_ibfk_application` FOREIGN KEY (`application_id`) REFERENCES `application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `leave_message` ADD CONSTRAINT `leave_message_ibfk_author` FOREIGN KEY (`author_user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;