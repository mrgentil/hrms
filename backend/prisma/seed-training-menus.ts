
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedTrainingMenus() {
    console.log('🌱 Seeding Training Menus...');

    // 1. Get or Create Permissions
    const permissions = [
        { name: 'training.view', desc: 'Voir le catalogue et les formations' },
        { name: 'training.view_own', desc: 'Voir ses propres formations et plans' },
        { name: 'training.manage', desc: 'Gérer les inscriptions et formations' },
        { name: 'training.create', desc: 'Créer des formations et modules' }
    ];

    const perms: any = {};
    for (const p of permissions) {
        perms[p.name] = await prisma.permission.upsert({
            where: { name: p.name },
            update: {},
            create: {
                name: p.name,
                description: p.desc,
                created_at: new Date(),
                updated_at: new Date()
            }
        });
    }

    // 2. Create Main Menu Section "Formation & Développement"
    const mainMenu = await prisma.menu_item.upsert({
        where: { id: 50 }, // Use a distinct ID range
        update: {},
        create: {
            id: 50,
            name: "Formation & Développement",
            icon: "🎓", // Mortarboard/Graduation cap icon emoji
            section: "hrms",
            sort_order: 10,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        }
    });

    // 3. Create Sub-menus
    const subMenus = [
        { id: 51, name: "Catalogue", path: "/training/catalog", perm: 'training.view', order: 1 },
        { id: 52, name: "Mes Formations", path: "/training/my-trainings", perm: 'training.view_own', order: 2 },
        { id: 53, name: "Inscriptions", path: "/training/registrations", perm: 'training.manage', order: 3 },
        { id: 54, name: "Plan de Développement", path: "/training/development-plans", perm: 'training.view_own', order: 4 },
        { id: 55, name: "Certifications", path: "/training/certifications", perm: 'training.view_own', order: 5 },
        { id: 56, name: "E-Learning", path: "/training/elearning", perm: 'training.view_own', order: 6 }
    ];

    for (const sub of subMenus) {
        await prisma.menu_item.upsert({
            where: { id: sub.id },
            update: {
                parent_id: mainMenu.id,
                permission_id: perms[sub.perm].id
            },
            create: {
                id: sub.id,
                name: sub.name,
                path: sub.path,
                parent_id: mainMenu.id,
                permission_id: perms[sub.perm].id,
                section: "hrms",
                sort_order: sub.order,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        });
    }

    console.log('✅ Training menus seeded successfully!');
}

seedTrainingMenus()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
