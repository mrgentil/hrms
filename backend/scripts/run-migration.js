const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    // Configuration de la base de données (ajustez selon votre configuration)
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Ajustez si vous avez un mot de passe
      database: 'hrms_db',
      multipleStatements: true
    });

    console.log('🔗 Connexion à la base de données réussie');

    // Lire le fichier SQL de migration
    const sqlFile = path.join(__dirname, 'migrate-to-permissions.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 Exécution du script de migration...');

    // Exécuter le script SQL
    const [results] = await connection.execute(sqlContent);
    
    console.log('✅ Migration terminée avec succès !');

    // Vérifier les résultats
    const [users] = await connection.execute(`
      SELECT u.username, u.full_name, u.role as old_role, r.name as new_role
      FROM user u
      JOIN user_role ur ON u.id = ur.user_id
      JOIN role r ON ur.role_id = r.id
      ORDER BY u.username
    `);

    console.log('\n👥 Utilisateurs migrés :');
    users.forEach(user => {
      console.log(`  - ${user.full_name} (${user.username}): ${user.old_role} → ${user.new_role}`);
    });

    // Vérifier les permissions
    const [permissions] = await connection.execute('SELECT COUNT(*) as count FROM permission');
    console.log(`\n🔐 Permissions créées : ${permissions[0].count}`);

    const [roles] = await connection.execute('SELECT COUNT(*) as count FROM role');
    console.log(`🎭 Rôles créés : ${roles[0].count}`);

    const [rolePermissions] = await connection.execute('SELECT COUNT(*) as count FROM role_permission');
    console.log(`🔗 Liaisons rôle-permission : ${rolePermissions[0].count}`);

    const [userRoles] = await connection.execute('SELECT COUNT(*) as count FROM user_role');
    console.log(`👤 Liaisons utilisateur-rôle : ${userRoles[0].count}`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
