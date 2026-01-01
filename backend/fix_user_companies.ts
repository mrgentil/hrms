
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const result = await prisma.user.updateMany({
        where: { company_id: null },
        data: { company_id: 1 }
    });
    console.log(`UPDATED_USERS: ${result.count}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
