-- Vérification des données existantes
SELECT 'UTILISATEURS ACTUELS' as section;
SELECT id, username, full_name, role, active FROM user;

SELECT 'ROLES EXISTANTS' as section;
SELECT * FROM role;

SELECT 'PERMISSIONS EXISTANTES' as section;  
SELECT * FROM permission;

SELECT 'LIAISONS USER_ROLE' as section;
SELECT ur.id, u.username, r.name as role_name 
FROM user_role ur 
LEFT JOIN user u ON ur.user_id = u.id 
LEFT JOIN role r ON ur.role_id = r.id;

SELECT 'LIAISONS ROLE_PERMISSION' as section;
SELECT rp.id, r.name as role_name, p.name as permission_name
FROM role_permission rp
LEFT JOIN role r ON rp.role_id = r.id
LEFT JOIN permission p ON rp.permission_id = p.id;
