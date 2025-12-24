import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script pour ajouter les menus manquants pour les employés
 * (Formation, Paie, Performance, Assets, Planification, Bien-être)
 */

async function addEmployeeMenus() {
    console.log('🚀 Ajout des menus employés manquants...\n');
    const now = new Date();

    // Récupérer les permissions
    const allPerms = await prisma.permission.findMany();
    const permMap = new Map(allPerms.map(p => [p.name, p.id]));

    // Nouveaux menus à ajouter
    const newMenus = [
        // Formation & Développement
        {
            name: 'Formation & Développement',
            path: null,
            icon: '📚',
            section: 'main',
            sort_order: 9,
            permission: 'training.view',
            children: [
                { name: 'Catalogue de Formations', path: '/training/catalog', icon: '📖', permission: 'training.view' },
                { name: 'Mes Formations', path: '/training/my-trainings', icon: '🎓', permission: 'training.view' },
                { name: 'E-Learning', path: '/training/elearning', icon: '💻', permission: 'training.view' },
                { name: 'Mes Certifications', path: '/training/certifications', icon: '🏆', permission: 'training.certifications' },
            ]
        },

        // Paie & Rémunération (Self-Service)
        {
            name: 'Ma Paie',
            path: null,
            icon: '💰',
            section: 'main',
            sort_order: 10,
            permission: 'payroll.view_own',
            children: [
                { name: 'Mes Bulletins de Paie', path: '/payroll/my-payslips', icon: '📄', permission: 'payroll.view_own' },
                { name: 'Demander une Avance', path: '/payroll/advances', icon: '💵', permission: 'payroll.advances' },
                { name: 'Demandes de Fonds', path: '/payroll/fund-requests', icon: '💼', permission: 'payroll.fund_requests' },
                { name: 'Simulateur de Salaire', path: '/payroll/simulator', icon: '🧮', permission: 'payroll.view_own' },
            ]
        },

        // Performance & Évaluations (Self-Service)
        {
            name: 'Ma Performance',
            path: null,
            icon: '📊',
            section: 'main',
            sort_order: 11,
            permission: 'performance.view_own',
            children: [
                { name: 'Mes Objectifs', path: '/performance/my-goals', icon: '🎯', permission: 'performance.view_own' },
                { name: 'Mes Évaluations', path: '/performance/my-reviews', icon: '📝', permission: 'performance.view_own' },
                { name: 'Reconnaissance', path: '/performance/recognition', icon: '🌟', permission: 'performance.recognition' },
            ]
        },

        // Mon Matériel
        {
            name: 'Mon Matériel',
            path: null,
            icon: '💻',
            section: 'main',
            sort_order: 12,
            permission: 'assets.view_own',
            children: [
                { name: 'Mon Équipement', path: '/assets/my-assets', icon: '🖥️', permission: 'assets.view_own' },
                { name: 'Demander du Matériel', path: '/assets/requests', icon: '📦', permission: 'assets.request' },
            ]
        },

        // Planification & Réservations
        {
            name: 'Planning & Réservations',
            path: null,
            icon: '📅',
            section: 'main',
            sort_order: 13,
            permission: 'planning.view',
            children: [
                { name: 'Planning d\'Équipe', path: '/planning/team', icon: '👥', permission: 'planning.view' },
                { name: 'Réserver une Salle', path: '/planning/rooms', icon: '🚪', permission: 'planning.rooms' },
                { name: 'Mon Télétravail', path: '/planning/remote-work', icon: '🏠', permission: 'planning.remote_work' },
            ]
        },

        // Bien-être & Engagement
        {
            name: 'Bien-être & Engagement',
            path: null,
            icon: '💬',
            section: 'main',
            sort_order: 14,
            permission: 'wellbeing.view',
            children: [
                { name: 'Ressources Bien-être', path: '/wellbeing/resources', icon: '🧘', permission: 'wellbeing.view' },
                { name: 'Sondages', path: '/wellbeing/surveys', icon: '📊', permission: 'wellbeing.surveys' },
                { name: 'Événements d\'Entreprise', path: '/wellbeing/events', icon: '🎉', permission: 'wellbeing.events' },
            ]
        },
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const menu of newMenus) {
        // Vérifier si le menu parent existe déjà
        const existing = await prisma.menu_item.findFirst({
            where: { name: menu.name, parent_id: null },
        });

        if (existing) {
            console.log(`⏭️  Menu "${menu.name}" existe déjà`);
            skippedCount++;
            continue;
        }

        // Créer le menu parent
        const parentMenu = await prisma.menu_item.create({
            data: {
                name: menu.name,
                path: menu.path,
                icon: menu.icon,
                section: menu.section,
                sort_order: menu.sort_order,
                permission_id: menu.permission ? permMap.get(menu.permission) : null,
                is_active: true,
                created_at: now,
                updated_at: now,
            },
        });

        console.log(`✅ Menu parent créé: ${menu.name}`);
        addedCount++;

        // Créer les enfants
        if (menu.children) {
            let childOrder = 1;
            for (const child of menu.children) {
                await prisma.menu_item.create({
                    data: {
                        name: child.name,
                        path: child.path,
                        icon: child.icon,
                        parent_id: parentMenu.id,
                        section: menu.section,
                        sort_order: childOrder++,
                        permission_id: child.permission ? permMap.get(child.permission) : null,
                        is_active: true,
                        created_at: now,
                        updated_at: now,
                    },
                });
                console.log(`   ✅ Sous-menu: ${child.name}`);
                addedCount++;
            }
        }

        console.log('');
    }

    console.log('═'.repeat(60));
    console.log(`📊 RÉSUMÉ:`);
    console.log(`   ✅ Nouveaux menus ajoutés: ${addedCount}`);
    console.log(`   ⏭️  Menus existants ignorés: ${skippedCount}`);
    console.log('═'.repeat(60));
    console.log('');
    console.log('💡 NOTE IMPORTANTE:');
    console.log('   Les employés doivent se déconnecter et se reconnecter');
    console.log('   pour voir les nouveaux menus !');
    console.log('');
}

addEmployeeMenus()
    .catch((e) => {
        console.error('❌ ERREUR:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
