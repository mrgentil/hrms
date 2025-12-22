-- Ajouter les champs manquants à la table permission
ALTER TABLE `permission` 
ADD COLUMN `group_name` VARCHAR(100) NULL AFTER `description`,
ADD COLUMN `group_icon` VARCHAR(10) NULL AFTER `group_name`,
ADD COLUMN `label` VARCHAR(255) NULL AFTER `group_icon`,
ADD COLUMN `sort_order` INT DEFAULT 0 AFTER `label`;

-- Créer la table menu_item pour les menus dynamiques
CREATE TABLE `menu_item` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `path` VARCHAR(255) NULL,
  `icon` VARCHAR(50) NULL,
  `parent_id` INT NULL,
  `permission_id` INT NULL,
  `sort_order` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT true,
  `section` VARCHAR(100) DEFAULT 'main',
  `description` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `menu_item_parent_id` (`parent_id`),
  INDEX `menu_item_permission_id` (`permission_id`),
  CONSTRAINT `menu_item_parent_fk` FOREIGN KEY (`parent_id`) REFERENCES `menu_item` (`id`) ON DELETE SET NULL,
  CONSTRAINT `menu_item_permission_fk` FOREIGN KEY (`permission_id`) REFERENCES `permission` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
