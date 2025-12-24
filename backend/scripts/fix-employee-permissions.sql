-- Script SQL complet pour configurer les permissions du rôle Employé
-- Permet aux employés d'accéder à leurs propres données et services

-- ============================================
-- 1. PERMISSIONS DE BASE
-- ============================================

-- Départements - Vue (lecture seule)
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'departments.view';

-- Postes - Vue (lecture seule)
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'positions.view';

-- Annonces - Vue
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'announcements.view';

-- Utilisateurs - Vue (pour voir les contrats)
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'users.view';

-- ============================================
-- 2. FORMATION & DÉVELOPPEMENT
-- ============================================

-- Voir les formations disponibles
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'training.view';

-- S'inscrire aux formations
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'training.register';

-- Gérer ses certifications
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'training.certifications';

-- ============================================
-- 3. PAIE & RÉMUNÉRATION
-- ============================================

-- Voir ses propres bulletins de paie
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'payroll.view_own';

-- Demander une avance sur salaire
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'payroll.advances';

-- Demander des fonds (dépenses business)
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'payroll.fund_requests';

-- ============================================
-- 4. PERFORMANCE & ÉVALUATIONS
-- ============================================

-- Voir sa propre performance
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'performance.view_own';

-- Participer aux évaluations
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'performance.reviews';

-- Envoyer/recevoir des kudos
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'performance.recognition';

-- ============================================
-- 5. ASSETS & ÉQUIPEMENTS
-- ============================================

-- Voir son propre matériel assigné
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'assets.view_own';

-- Demander du nouveau matériel
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'assets.request';

-- ============================================
-- 6. PLANIFICATION & RESSOURCES
-- ============================================

-- Voir le planning d'équipe
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'planning.view';

-- Réserver des salles de réunion
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'planning.rooms';

-- Déclarer ses jours de télétravail
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'planning.remote_work';

-- ============================================
-- 7. POINTAGE
-- ============================================

-- Voir son propre pointage
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'attendance.view_own';

-- Pointer ses entrées/sorties
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'attendance.clock';

-- Demander une correction de pointage
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'attendance.correct';

-- ============================================
-- 8. BIEN-ÊTRE & ENGAGEMENT
-- ============================================

-- Accéder aux ressources bien-être
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'wellbeing.view';

-- Participer aux sondages satisfaction
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'wellbeing.surveys';

-- Accéder aux événements d'entreprise
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'wellbeing.events';

-- ============================================
-- 9. CONGÉS (déjà assigné mais on s'assure)
-- ============================================

-- Voir les congés (ses demandes et calendrier équipe)
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'leaves.view';

-- Voir le calendrier des congés d'équipe
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r CROSS JOIN permission p
WHERE r.name = 'Employé' AND p.name = 'leaves.view_team';

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

SELECT 
    '========================================' as separator;
    
SELECT 
    'RÉSUMÉ DES PERMISSIONS DU RÔLE EMPLOYÉ' as titre;

SELECT 
    '========================================' as separator;

SELECT 
    r.name as role_name,
    COUNT(p.id) as total_permissions
FROM role r
LEFT JOIN role_permission rp ON r.id = rp.role_id
LEFT JOIN permission p ON rp.permission_id = p.id
WHERE r.name = 'Employé'
GROUP BY r.id, r.name;

SELECT 
    '========================================' as separator;

SELECT 
    'LISTE DÉTAILLÉE DES PERMISSIONS' as titre;
    
SELECT 
    '========================================' as separator;

SELECT 
    p.group_name as module,
    p.name as permission,
    p.label as description
FROM role r
LEFT JOIN role_permission rp ON r.id = rp.role_id
LEFT JOIN permission p ON rp.permission_id = p.id
WHERE r.name = 'Employé'
ORDER BY p.group_name, p.name;
