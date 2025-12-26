const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const unread = await prisma.user_message.findMany({
        where: { recipient_user_id: 1, is_read: false },
        select: { conversation_id: true }
    });
    const uniqueConvos = [...new Set(unread.map(u => u.conversation_id))];
    console.log('Conversations with unread messages for user 1:', uniqueConvos);

    if (uniqueConvos.length > 0) {
        console.log('Marking conversation', uniqueConvos[0], 'as read...');
        const result = await prisma.user_message.updateMany({
            where: { conversation_id: uniqueConvos[0], recipient_user_id: 1, is_read: false },
            data: { is_read: true, read_at: new Date() }
        });
        console.log('Updated', result.count, 'messages');

        const countAfter = await prisma.user_message.count({
            where: { recipient_user_id: 1, is_read: false }
        });
        console.log('Total unread count now:', countAfter);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
