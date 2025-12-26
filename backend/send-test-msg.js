const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Find user 1 and user 2
    const user1 = await prisma.user.findUnique({ where: { id: 1 } });
    const user2 = await prisma.user.findUnique({ where: { id: 2 } });

    if (!user1 || !user2) {
        console.error('User 1 or 2 not found');
        return;
    }

    // Find or create a conversation between them
    let conversation = await prisma.conversation.findFirst({
        where: {
            is_group: false,
            conversation_participant: {
                every: {
                    user_id: { in: [1, 2] }
                }
            }
        }
    });

    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                is_group: false,
                created_by_user_id: 2,
                created_at: new Date(),
                updated_at: new Date(),
                conversation_participant: {
                    createMany: {
                        data: [
                            { user_id: 1, joined_at: new Date(), created_at: new Date(), updated_at: new Date() },
                            { user_id: 2, joined_at: new Date(), created_at: new Date(), updated_at: new Date() }
                        ]
                    }
                }
            }
        });
    }

    // Send a message from user 2 to user 1
    const message = await prisma.user_message.create({
        data: {
            text: 'Test message for badge',
            sender_user_id: 2,
            recipient_user_id: 1,
            conversation_id: conversation.id,
            is_read: false,
            created_at: new Date(),
            updated_at: new Date()
        }
    });

    console.log('Message sent:', message.id);

    const unreadCount = await prisma.user_message.count({
        where: { recipient_user_id: 1, is_read: false }
    });
    console.log('Unread count for user 1:', unreadCount);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
