/**
 * Script de seeding des permissions HRMS
 * Exécuter avec: npx ts-node prisma/seed-permissions.ts
 */

import { PrismaClient } from '@prisma/client';
import { PERMISSION_GROUPS } from '../src/common/constants/permissions.constants';

const prisma = new PrismaClient();

async function seedPermissions() {
    console.log('🔐 Seeding des permissions HRMS...\n');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const group of PERMISSION_GROUPS) {
        console.log(`📦 Groupe: ${group.icon} ${group.name}`);

        for (const perm of group.permissions) {
            try {
                const existing = await prisma.permission.findUnique({
                    where: { name: perm.key },
                });

                if (existing) {
                    // Mettre à jour la description si elle a changé
                    if (existing.description !== perm.description) {
                        await prisma.permission.update({
                            where: { name: perm.key },
                            data: {
                                description: perm.description,
                                updated_at: new Date(),
                            },
                        });
                        console.log(`  ✏️  ${perm.key} - mis à jour`);
                        updated++;
                    } else {
                        console.log(`  ⏭️  ${perm.key} - déjà présent`);
                        skipped++;
                    }
                } else {
                    await prisma.permission.create({
                        data: {
                            name: perm.key,
                            description: perm.description,
                            created_at: new Date(),
                            updated_at: new Date(),
                        },
                    });
                    console.log(`  ✅ ${perm.key} - créé`);
                    created++;
                }
            } catch (error) {
                console.error(`  ❌ ${perm.key} - erreur:`, error);
            }
        }
        console.log('');
    }

    console.log('📊 Résumé:');
    console.log(`   Créées: ${created}`);
    console.log(`   Mises à jour: ${updated}`);
    console.log(`   Déjà présentes: ${skipped}`);
    console.log('\n✅ Seeding des permissions terminé!');
}

seedPermissions()
    .catch((e) => {
        console.error('❌ Erreur lors du seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
