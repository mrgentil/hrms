
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Update Role Permissions...');

    const permissionsToAdd = ['expenses.approve', 'users.view'];
    const rolesToUpdate = ['Directeur Finance', 'Financier', 'Administrateur', 'Super Administrateur'];

    for (const permissionName of permissionsToAdd) {
        // 1. Ensure Permission exists
        let permission = await prisma.permission.findUnique({ where: { name: permissionName } });
        if (!permission) {
            console.log(`Permission ${permissionName} not found, creating...`);
            permission = await prisma.permission.create({
                data: {
                    name: permissionName,
                    description: permissionName,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });
        }

        // 2. Assign to Roles
        for (const roleName of rolesToUpdate) {
            const role = await prisma.role.findFirst({ where: { name: roleName } });
            if (role) {
                const existing = await prisma.role_permission.findFirst({
                    where: {
                        role_id: role.id,
                        permission_id: permission.id
                    }
                });

                if (!existing) {
                    await prisma.role_permission.create({
                        data: {
                            role_id: role.id,
                            permission_id: permission.id,
                            created_at: new Date(),
                            updated_at: new Date()
                        }
                    });
                    console.log(`✅ Assigned ${permissionName} to ${roleName}`);
                } else {
                    console.log(`ℹ️ ${permissionName} already assigned to ${roleName}`);
                }
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
