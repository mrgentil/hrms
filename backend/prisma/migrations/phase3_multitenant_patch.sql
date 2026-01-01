-- MIGRATION MULTI-TENANT PHASE 3 (DÉPARTEMENTS & POSTES)
-- Cette migration est conçue pour être NON-DESTRUCTIVE et IDEMPOTENTE.

-- 1. CRÉATION DE LA COMPAGNIE PAR DÉFAUT (Idempotent)
-- On s'assure qu'une entreprise existe pour accueillir les données existantes.
INSERT IGNORE INTO `company` (`id`, `name`, `timezone`, `currency`, `language`, `is_active`, `created_at`, `updated_at`) 
VALUES (1, 'Entreprise Par Défaut', 'UTC', 'USD', 'fr', 1, NOW(), NOW());

-- 2. ALIGNEMENT DES DONNÉES (Préparation aux contraintes NOT NULL)
-- On assigne tous les enregistrements orphelins à la compagnie 1.
UPDATE `department` SET `company_id` = 1 WHERE `company_id` IS NULL OR `company_id` = 0;
UPDATE `position` SET `company_id` = 1 WHERE `company_id` IS NULL OR `company_id` = 0;

-- Sécurité pour les noms (si renommage récent)
UPDATE `department` SET `name` = 'Nouveau Département' WHERE `name` IS NULL OR `name` = '';

-- 3. RENFORCEMENT DE LA STRUCTURE (Passage en NOT NULL)
-- Ces étapes échoueraient si les données n'étaient pas alignées ci-dessus.
ALTER TABLE `department` MODIFY `company_id` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `position` MODIFY `company_id` INTEGER NOT NULL DEFAULT 1;

-- 4. ÉTABLISSEMENT DES RELATIONS (Foreign Keys)
-- On n'ajoute que si elles n'existent pas (test via SQL si nécessaire ou via Prisma Migrate plus tard).
-- Note: Ces commandes peuvent échouer si la contrainte existe déjà, ce qui est sans risque.
ALTER TABLE `department` 
ADD CONSTRAINT `dept_company_fk` 
FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `position` 
ADD CONSTRAINT `pos_company_fk` 
FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `position` 
ADD CONSTRAINT `pos_department_fk` 
FOREIGN KEY (`department_id`) REFERENCES `department`(`id`) 
ON DELETE SET NULL ON UPDATE CASCADE;
