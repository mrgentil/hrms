-- ============================================
-- Script SQL pour corriger les données Railway
-- Exécutez ce script AVANT de redéployer
-- ============================================

-- Étape 1: Vérifier si une entreprise existe
SELECT id, name FROM company LIMIT 5;

-- Étape 2: Si aucune entreprise n'existe, en créer une
-- (Décommentez et modifiez si nécessaire)
-- INSERT INTO company (name, currency, timezone, language, date_format, is_active, created_at, updated_at)
-- VALUES ('Entreprise Principale', '$', 'UTC', 'fr', 'YYYY-MM-DD', true, NOW(), NOW());

-- Étape 3: Mettre à jour les départements avec company_id NULL
-- Option A: Définir tous les company_id à NULL (permet le déploiement)
UPDATE department SET company_id = NULL WHERE company_id IS NOT NULL 
  AND company_id NOT IN (SELECT id FROM company);

-- Option B: Définir tous les company_id à une valeur valide (ex: 1)
-- UPDATE department SET company_id = 1;

-- Étape 4: Mettre à jour les positions avec company_id NULL
UPDATE position SET company_id = NULL WHERE company_id IS NOT NULL 
  AND company_id NOT IN (SELECT id FROM company);

-- Étape 5: Vérification
SELECT 
  'Departments sans company valide' as check_type,
  COUNT(*) as count 
FROM department 
WHERE company_id IS NOT NULL AND company_id NOT IN (SELECT id FROM company)
UNION ALL
SELECT 
  'Positions sans company valide' as check_type,
  COUNT(*) as count 
FROM position 
WHERE company_id IS NOT NULL AND company_id NOT IN (SELECT id FROM company);

-- Si les deux compteurs sont à 0, vous pouvez redéployer !
