-- ============================================
-- DIAGNOSTIC COMPLET: Permissions Employé
-- ============================================

-- 1. Vérifier le rôle Employé existe
SELECT '==== RÔLE EMPLOYÉ ====' as section;
SELECT id, name, description, color
FROM role
WHERE name = 'Employé';

-- 2. Compter les permissions assignées
SELECT '==== NOMBRE DE PERMISSIONS ====' as section;
SELECT 
    COUNT(*) as total_permissions
FROM role_permission rp
JOIN role r ON rp.role_id = r.id
WHERE r.name = 'Employé';

-- 3. Lister TOUTES les permissions du rôle Employé
SELECT '==== LISTE COMPLÈTE DES PERMISSIONS ====' as section;
SELECT 
    p.name as permission_name,
    p.label as permission_label,
    p.group_name as groupe
FROM role r
JOIN role_permission rp ON r.id = rp.role_id
JOIN permission p ON rp.permission_id = p.id
WHERE r.name = 'Employé'
ORDER BY p.group_name, p.name;

-- 4. Vérifier les permissions spécifiques pour les nouveaux menus
SELECT '==== PERMISSIONS POUR NOUVEAUX MENUS ====' as section;
SELECT 
    p.name as permission_name,
    CASE 
        WHEN rp.id IS NOT NULL THEN 'OUI ✓'
        ELSE 'NON ✗'
    END as assignee_au_role_employe
FROM role r
CROSS JOIN (
    SELECT 'training.view' as perm_name
    UNION SELECT 'training.register'
    UNION SELECT 'training.certifications'
    UNION SELECT 'payroll.view_own'
    UNION SELECT 'payroll.advances'
    UNION SELECT 'payroll.fund_requests'
    UNION SELECT 'performance.view_own'
    UNION SELECT 'performance.reviews'
    UNION SELECT 'performance.recognition'
    UNION SELECT 'assets.view_own'
    UNION SELECT 'assets.request'
    UNION SELECT 'planning.view'
    UNION SELECT 'planning.rooms'
    UNION SELECT 'planning.remote_work'
    UNION SELECT 'wellbeing.view'
    UNION SELECT 'wellbeing.surveys'
    UNION SELECT 'wellbeing.events'
) AS required_perms
LEFT JOIN permission p ON p.name = required_perms.perm_name
LEFT JOIN role_permission rp ON rp.role_id = r.id AND rp.permission_id = p.id
WHERE r.name = 'Employé'
ORDER BY required_perms.perm_name;

-- 5. Vérifier les menus créés et leurs permissions requises
SELECT '==== MENUS ET PERMISSIONS REQUISES ====' as section;
SELECT 
    mi.id,
    mi.name as menu_name,
    mi.icon,
    mi.path,
    p.name as permission_requise,
    mi.is_active as actif,
    mi.sort_order as ordre
FROM menu_item mi
LEFT JOIN permission p ON mi.permission_id = p.id
WHERE mi.parent_id IS NULL  -- Seulement les menus parents
ORDER BY mi.section, mi.sort_order;

-- 6. Vérifier si les permissions des menus existent dans la table permission
SELECT '==== PERMISSIONS DES MENUS - EXISTENCE ====' as section;
SELECT DISTINCT
    mi.name as menu_name,
    p.name as permission_name,
    CASE 
        WHEN p.id IS NULL THEN 'PERMISSION MANQUANTE ✗'
        ELSE 'Existe ✓'
    END as statut
FROM menu_item mi
LEFT JOIN permission p ON mi.permission_id = p.id
WHERE mi.permission_id IS NOT NULL
ORDER BY mi.name;

-- 7. Utilisateurs avec rôle Employé
SELECT '==== UTILISATEURS EMPLOYÉS ====' as section;
SELECT 
    u.id,
    u.full_name,
    u.work_email,
    r.name as role_name
FROM user u
JOIN role r ON u.role_id = r.id
WHERE r.name = 'Employé'
LIMIT 5;
