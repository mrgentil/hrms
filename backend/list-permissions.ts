import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ group_name: 'asc' }, { sort_order: 'asc' }, { name: 'asc' }],
  });

  console.log('\n=== PERMISSIONS DISPONIBLES ===\n');

  const groups: Record<string, typeof permissions> = {};
  permissions.forEach((p) => {
    const g = p.group_name || 'Autre';
    if (!groups[g]) groups[g] = [];
    groups[g].push(p);
  });

  for (const [groupName, perms] of Object.entries(groups)) {
    const icon = perms[0]?.group_icon || '📋';
    console.log(`\n${icon} ${groupName.toUpperCase()}`);
    console.log('─'.repeat(50));
    perms.forEach((p) => {
      console.log(`  • ${p.name}`);
      console.log(`    └─ ${p.label || p.description || '(pas de description)'}`);
    });
  }

  console.log(`\n\n📊 Total: ${permissions.length} permissions\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
