const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Find users with profile_photo_url that doesn't start with /
    const users = await prisma.user.findMany({
        where: {
            profile_photo_url: {
                not: null
            }
        },
        select: {
            id: true,
            full_name: true,
            profile_photo_url: true
        }
    });

    console.log('Users with profile photos:');
    for (const user of users) {
        console.log(`ID: ${user.id} | Name: ${user.full_name} | Photo: ${user.profile_photo_url}`);

        // Fix path if it doesn't start with /
        if (user.profile_photo_url && !user.profile_photo_url.startsWith('/')) {
            const fixedUrl = '/' + user.profile_photo_url;
            await prisma.user.update({
                where: { id: user.id },
                data: { profile_photo_url: fixedUrl }
            });
            console.log(`  -> Fixed to: ${fixedUrl}`);
        }
    }
}

main().finally(() => prisma.$disconnect());
