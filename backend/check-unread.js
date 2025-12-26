const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.user_message.count({
        where: {
            recipient_user_id: 1,
            is_read: false
        }
    });
    console.log('Unread count for user 1:', count);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
