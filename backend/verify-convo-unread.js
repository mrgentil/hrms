const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userId = 1; // Testing for user 1

    // Get conversations using similar logic to service
    const conversations = await prisma.conversation.findMany({
        where: {
            conversation_participant: {
                some: { user_id: userId, left_at: null },
            },
        },
        include: {
            user_message: {
                orderBy: { created_at: 'desc' },
                take: 1,
            },
        },
    });

    console.log(`Found ${conversations.length} conversations for user ${userId}`);

    for (const conv of conversations) {
        const unreadCount = await prisma.user_message.count({
            where: {
                conversation_id: conv.id,
                recipient_user_id: userId,
                is_read: false,
            },
        });
        console.log(`Conv ID: ${conv.id}, Unread Count: ${unreadCount}, Last Msg: ${conv.user_message[0]?.text || 'None'}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
