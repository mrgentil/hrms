const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Début du seeding des utilisateurs...');

    // ============================================
    // CRÉATION DES RÔLES (Si inexistants)
    // ============================================
    const rolesData = [
        { name: 'Admin', description: 'Administrateur système avec accès complet', is_system: true, color: '#ff0000' },
        { name: 'RH', description: 'Gestion des ressources humaines', is_system: false, color: '#00ff00' },
        { name: 'Directeur Finance', description: 'Accès aux modules financiers', is_system: false, color: '#0000ff' },
        { name: 'Employee', description: 'Employé standard', is_system: true, color: '#cccccc' },
        { name: 'Manager', description: 'Manager d\'équipe', is_system: false, color: '#fea500' }
    ];

    console.log('🛡️ Vérification des rôles...');
    for (const r of rolesData) {
        await prisma.role.upsert({
            where: { name: r.name },
            update: {},
            create: {
                name: r.name,
                description: r.description,
                is_system: r.is_system,
                color: r.color,
                created_at: new Date(),
                updated_at: new Date(),
            }
        });
    }

    // Recharger les données
    const departments = await prisma.department.findMany();
    const positions = await prisma.position.findMany();
    const roles = await prisma.role.findMany();

    if (departments.length === 0 || positions.length === 0) {
        console.error('❌ Départements ou Postes manquants. Exécutez departments-positions.seed.js d\'abord.');
        return;
    }

    console.log(`✓ ${departments.length} départements disponibles`);
    console.log(`✓ ${positions.length} postes disponibles`);
    console.log(`✓ ${roles.length} rôles disponibles`);

    // Mot de passe par défaut
    const defaultPassword = await bcrypt.hash('password123', 10);

    // ============================================
    // 30 UTILISATEURS
    // ============================================

    const users = [
        // --- Direction (5 personnes) ---
        {
            full_name: 'Jean Dupont',
            email: 'jean.dupont@company.com',
            position: 'Directeur Général',
            department: 'Direction Générale',
            role: 'Admin',
            userRoleEnum: 'ROLE_SUPER_ADMIN',
            hire_date: '2015-01-15'
        },
        {
            full_name: 'Marie Lambert',
            email: 'marie.lambert@company.com',
            position: 'Directeur des Ressources Humaines',
            department: 'Ressources Humaines',
            role: 'RH',
            userRoleEnum: 'ROLE_RH',
            hire_date: '2016-03-20'
        },
        {
            full_name: 'Pierre Martin',
            email: 'pierre.martin@company.com',
            position: 'Directeur Financier (CFO)',
            department: 'Finance et Comptabilité',
            role: 'Directeur Finance',
            userRoleEnum: 'ROLE_MANAGER',
            hire_date: '2016-06-10'
        },
        {
            full_name: 'Sophie Durand',
            email: 'sophie.durand@company.com',
            position: 'Directeur Informatique (CTO)',
            department: 'Informatique',
            role: 'Admin',
            userRoleEnum: 'ROLE_ADMIN',
            hire_date: '2017-02-01'
        },
        {
            full_name: 'Luc Bernard',
            email: 'luc.bernard@company.com',
            position: 'Directeur Juridique',
            department: 'Juridique',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2017-09-15'
        },

        // --- Informatique (7 personnes) ---
        {
            full_name: 'Thomas Rousseau',
            email: 'thomas.rousseau@company.com',
            position: 'Développeur Full Stack',
            department: 'Informatique',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2019-04-10'
        },
        {
            full_name: 'Emma Petit',
            email: 'emma.petit@company.com',
            position: 'Développeur Frontend',
            department: 'Informatique',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2020-01-15'
        },
        {
            full_name: 'Lucas Moreau',
            email: 'lucas.moreau@company.com',
            position: 'Développeur Backend',
            department: 'Informatique',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2020-05-20'
        },
        {
            full_name: 'Chloé Simon',
            email: 'chloe.simon@company.com',
            position: 'DevOps Engineer',
            department: 'Informatique',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2021-03-01'
        },
        {
            full_name: 'Hugo Laurent',
            email: 'hugo.laurent@company.com',
            position: 'Data Scientist',
            department: 'Informatique',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2021-07-12'
        },
        {
            full_name: 'Léa Girard',
            email: 'lea.girard@company.com',
            position: 'Designer UX/UI',
            department: 'Informatique',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2022-01-10'
        },
        {
            full_name: 'Nathan Roux',
            email: 'nathan.roux@company.com',
            position: 'Technicien Support',
            department: 'Informatique',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2022-09-01'
        },

        // --- RH (4 personnes) ---
        {
            full_name: 'Camille Fontaine',
            email: 'camille.fontaine@company.com',
            position: 'Chargé de Recrutement',
            department: 'Ressources Humaines',
            role: 'RH',
            userRoleEnum: 'ROLE_RH',
            hire_date: '2018-11-05'
        },
        {
            full_name: 'Maxime Chevalier',
            email: 'maxime.chevalier@company.com',
            position: 'Chargé de Recrutement',
            department: 'Ressources Humaines',
            role: 'RH',
            userRoleEnum: 'ROLE_RH',
            hire_date: '2021-02-15'
        },
        {
            full_name: 'Julie Gauthier',
            email: 'julie.gauthier@company.com',
            position: 'Chef de Projet',
            department: 'Ressources Humaines',
            role: 'RH',
            userRoleEnum: 'ROLE_RH',
            hire_date: '2019-06-20'
        },
        {
            full_name: 'Alexandre Perrin',
            email: 'alexandre.perrin@company.com',
            position: 'Analyste Business',
            department: 'Ressources Humaines',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2023-01-10'
        },

        // --- Finance (4 personnes) ---
        {
            full_name: 'Sarah Morel',
            email: 'sarah.morel@company.com',
            position: 'Comptable',
            department: 'Finance et Comptabilité',
            role: 'Directeur Finance',
            userRoleEnum: 'ROLE_MANAGER',
            hire_date: '2018-03-12'
        },
        {
            full_name: 'Antoine Fournier',
            email: 'antoine.fournier@company.com',
            position: 'Comptable',
            department: 'Finance et Comptabilité',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2020-08-15'
        },
        {
            full_name: 'Clara Giraud',
            email: 'clara.giraud@company.com',
            position: 'Analyste Business',
            department: 'Finance et Comptabilité',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2022-04-01'
        },
        {
            full_name: 'Julien Blanc',
            email: 'julien.blanc@company.com',
            position: 'Chef de Projet',
            department: 'Finance et Comptabilité',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2021-10-15'
        },

        // --- Commercial (3 personnes) ---
        {
            full_name: 'Manon Bonnet',
            email: 'manon.bonnet@company.com',
            position: 'Commercial',
            department: 'Commercial et Ventes',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2019-05-20'
        },
        {
            full_name: 'Théo Dupuis',
            email: 'theo.dupuis@company.com',
            position: 'Commercial',
            department: 'Commercial et Ventes',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2020-11-10'
        },
        {
            full_name: 'Inès Mercier',
            email: 'ines.mercier@company.com',
            position: 'Chef de Projet',
            department: 'Commercial et Ventes',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2021-06-01'
        },

        // --- Marketing (3 personnes) ---
        {
            full_name: 'Louis Lefebvre',
            email: 'louis.lefebvre@company.com',
            position: 'Responsable Marketing',
            department: 'Marketing',
            role: 'Employee',
            userRoleEnum: 'ROLE_MANAGER',
            hire_date: '2018-09-15'
        },
        {
            full_name: 'Alice Leroy',
            email: 'alice.leroy@company.com',
            position: 'Designer UX/UI',
            department: 'Marketing',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2020-02-20'
        },
        {
            full_name: 'Victor Muller',
            email: 'victor.muller@company.com',
            position: 'Analyste Business',
            department: 'Marketing',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2022-07-01'
        },

        // --- Juridique (2 personnes) ---
        {
            full_name: 'Zoé Faure',
            email: 'zoe.faure@company.com',
            position: 'Juriste',
            department: 'Juridique',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2019-12-10'
        },
        {
            full_name: 'Gabriel Andre',
            email: 'gabriel.andre@company.com',
            position: 'Juriste',
            department: 'Juridique',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2021-04-15'
        },

        // --- Qualité (2 personnes) ---
        {
            full_name: 'Charlotte Lemoine',
            email: 'charlotte.lemoine@company.com',
            position: 'Responsable Qualité',
            department: 'Qualité',
            role: 'Employee',
            userRoleEnum: 'ROLE_MANAGER',
            hire_date: '2020-03-10'
        },
        {
            full_name: 'Arthur Garcia',
            email: 'arthur.garcia@company.com',
            position: 'Technicien Support',
            department: 'Qualité',
            role: 'Employee',
            userRoleEnum: 'ROLE_EMPLOYEE',
            hire_date: '2022-11-01'
        },
    ];

    console.log(`\n👥 Création de ${users.length} utilisateurs...\n`);
    let userCount = 0;

    for (const userData of users) {
        try {
            // Trouver les dépendances
            const dept = departments.find(d => d.department_name === userData.department);
            const pos = positions.find(p => p.title === userData.position);
            const role = roles.find(r => r.name === userData.role);

            if (!dept || !pos || !role) {
                console.log(`  ⚠ ${userData.full_name} - dépendance manquante`);
                continue;
            }

            await prisma.user.create({
                data: {
                    username: userData.email,
                    password: defaultPassword,
                    full_name: userData.full_name,
                    role: userData.userRoleEnum || 'ROLE_EMPLOYEE', // Utiliser les valeurs exactes de l'enum
                    role_id: role.id,
                    active: true,
                    department_id: dept.id,
                    work_email: userData.email,
                    hire_date: new Date(userData.hire_date),
                    position_id: pos.id,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            userCount++;
            console.log(`  ✓ ${userData.full_name}`);
        } catch (e) {
            if (e.code === 'P2002') {
                console.log(`  ℹ️  ${userData.full_name} (déjà existant)`);
            } else {
                console.error(`  ❌ ${userData.full_name} - ERREUR:`, e);
            }
        }
    }

    // ============================================
    // RÉSUMÉ
    // ============================================

    console.log('\n📊 Résumé du seeding :');
    console.log(`  ✓ ${userCount} utilisateurs ajoutés`);
    console.log('\n✅ Seeding terminé !');
}

main()
    .catch((e) => {
        console.error('❌ Erreur Fatale:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
