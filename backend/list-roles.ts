import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany({
    orderBy: { name: 'asc' },
  });

  console.log('\n=== RÔLES DISPONIBLES ===\n');

  roles.forEach((r) => {
    const perms = Array.isArray(r.permissions) ? (r.permissions as string[]).length : 0;
    const sys = r.is_system ? ' [SYSTÈME]' : '';
    console.log(`${r.icon || '👤'} ${r.name}${sys}`);
    console.log(`   📝 ${r.description || '(pas de description)'}`);
    console.log(`   🔐 ${perms} permissions | 🎨 ${r.color || 'default'}`);
    console.log('');
  });

  console.log(`\n📊 Total: ${roles.length} rôles\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
