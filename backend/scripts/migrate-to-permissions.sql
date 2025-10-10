-- Migration vers le système de permissions avancé
-- Ce script migre les données existantes sans casser le système actuel

-- 1. Créer les permissions de base
INSERT IGNORE INTO permission (name, description, created_at, updated_at) VALUES
('users.view', 'Voir la liste des utilisateurs', NOW(), NOW()),
('users.create', 'Créer de nouveaux utilisateurs', NOW(), NOW()),
('users.edit', 'Modifier les utilisateurs existants', NOW(), NOW()),
('users.delete', 'Supprimer des utilisateurs', NOW(), NOW()),
('users.manage_roles', 'Gérer les rôles des utilisateurs', NOW(), NOW()),
('reports.view', 'Voir les rapports', NOW(), NOW()),
('reports.export', 'Exporter les rapports', NOW(), NOW()),
('departments.view', 'Voir les départements', NOW(), NOW()),
('departments.manage', 'Gérer les départements', NOW(), NOW()),
('projects.view', 'Voir les projets', NOW(), NOW()),
('projects.manage', 'Gérer les projets', NOW(), NOW()),
('system.admin', 'Administration système complète', NOW(), NOW());

-- 2. Créer les rôles correspondants aux enums actuels
INSERT IGNORE INTO role (name, description, created_at, updated_at) VALUES
('Admin', 'Administrateur système avec tous les droits', NOW(), NOW()),
('Manager', 'Manager avec droits de gestion', NOW(), NOW()),
('Employee', 'Employé avec droits de base', NOW(), NOW());

-- 3. Assigner les permissions aux rôles
-- Admin : toutes les permissions
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r, permission p
WHERE r.name = 'Admin';

-- Manager : permissions de gestion limitées
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r, permission p
WHERE r.name = 'Manager' 
AND p.name IN ('users.view', 'users.create', 'users.edit', 'reports.view', 'reports.export', 'departments.view', 'projects.view', 'projects.manage');

-- Employee : permissions de base
INSERT IGNORE INTO role_permission (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM role r, permission p
WHERE r.name = 'Employee' 
AND p.name IN ('users.view', 'reports.view', 'departments.view', 'projects.view');

-- 4. Migrer les utilisateurs vers le système user_role
-- Admin users
INSERT IGNORE INTO user_role (user_id, role_id, created_at, updated_at)
SELECT u.id, r.id, NOW(), NOW()
FROM user u, role r
WHERE u.role = 'ROLE_ADMIN' AND r.name = 'Admin';

-- Manager users  
INSERT IGNORE INTO user_role (user_id, role_id, created_at, updated_at)
SELECT u.id, r.id, NOW(), NOW()
FROM user u, role r
WHERE u.role = 'ROLE_MANAGER' AND r.name = 'Manager';

-- Employee users
INSERT IGNORE INTO user_role (user_id, role_id, created_at, updated_at)
SELECT u.id, r.id, NOW(), NOW()
FROM user u, role r
WHERE u.role = 'ROLE_EMPLOYEE' AND r.name = 'Employee';

-- 5. Vérification des résultats
SELECT 'VERIFICATION - Utilisateurs migrés' as section;
SELECT u.username, u.full_name, u.role as old_role, r.name as new_role
FROM user u
JOIN user_role ur ON u.id = ur.user_id
JOIN role r ON ur.role_id = r.id
ORDER BY u.username;
