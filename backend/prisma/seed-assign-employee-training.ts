import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignEmployeePermissions() {
    console.log('🔧 Configuring Employee Training Access...');

    // 1. Ensure permissions exist
    const permissionsToAssign = [
        { name: 'training.view', description: 'Voir le catalogue de formations' },
        { name: 'training.register', description: 'S\'inscrire aux formations' },
        { name: 'training.view_own', description: 'Voir ses formations' } // Ensuring this one too
    ];

    const permissionIds: number[] = [];

    for (const p of permissionsToAssign) {
        const perm = await prisma.permission.upsert({
            where: { name: p.name },
            update: {},
            create: {
                name: p.name,
                description: p.description,
                created_at: new Date(),
                updated_at: new Date(),
            }
        });
        permissionIds.push(perm.id);
        console.log(`✅ Permission ensured: ${p.name}`);
    }

    // 2. Roles to update (Employé & Manager)
    const targetRoleNames = ['Employé', 'Manager', 'RH', 'Admin', 'Super Admin'];

    // Fetch roles
    const roles = await prisma.role.findMany({
        where: { name: { in: targetRoleNames } }
    });

    // 3. Assign permissions
    for (const role of roles) {
        console.log(`👉 Updating role: ${role.name}`);
        for (const permId of permissionIds) {
            await prisma.role_permission.upsert({
                where: {
                    role_id_permission_id: {
                        role_id: role.id,
                        permission_id: permId
                    }
                },
                update: {},
                create: {
                    role_id: role.id,
                    permission_id: permId,
                    created_at: new Date(),
                    updated_at: new Date(),
                }
            });
        }
    }

    console.log('🎉 Access configured! Employees can now View Catalog & Register.');
}

assignEmployeePermissions()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
