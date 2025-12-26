import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPermissions() {
    console.log('🔧 Fixing Training permissions...');

    // 1. Create permission
    const permName = 'training.view_own';
    const permission = await prisma.permission.upsert({
        where: { name: permName },
        update: {},
        create: {
            name: permName,
            description: 'Voir ses formations',
            created_at: new Date(),
            updated_at: new Date(),
        }
    });

    console.log(`✅ Permission ${permName} ensured id=${permission.id}`);

    // 2. Assign to ALL roles
    const roles = await prisma.role.findMany();

    for (const role of roles) {
        await prisma.role_permission.upsert({
            where: {
                role_id_permission_id: {
                    role_id: role.id,
                    permission_id: permission.id
                }
            },
            update: {},
            create: {
                role_id: role.id,
                permission_id: permission.id,
                created_at: new Date(),
                updated_at: new Date(),
            }
        });
        console.log(`   Linked to role: ${role.name}`);
    }

    console.log('🎉 Fix complete! Users should access "My Trainings".');
}

fixPermissions()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
