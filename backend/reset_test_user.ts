
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 12);
    const user = await prisma.user.update({
        where: { username: 'Tshitsho' },
        data: {
            password: hashedPassword,
            active: true,
            company_id: 1 // Double check he is in Company 1
        }
    });
    console.log(`Password reset for ${user.username} (Company: ${user.company_id})`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
