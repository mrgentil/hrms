const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Find ALL users
    const users = await prisma.user.findMany({
        select: {
            id: true,
            full_name: true,
            profile_photo_url: true
        },
        take: 20
    });

    console.log('All users profile photo status:');
    console.log('================================');
    for (const user of users) {
        const hasPhoto = user.profile_photo_url ? 'YES' : 'NO';
        console.log(`${user.id}. ${user.full_name}`);
        console.log(`   Has Photo: ${hasPhoto}`);
        if (user.profile_photo_url) {
            console.log(`   URL: ${user.profile_photo_url}`);
        }
        console.log('');
    }
}

main().finally(() => prisma.$disconnect());
