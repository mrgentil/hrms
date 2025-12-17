
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking expense 2...');
    try {
        const expense = await prisma.expense_report.findUnique({
            where: { id: 2 },
            include: { user: true }
        });

        if (!expense) {
            console.log('Expense 2 not found');
        } else {
            console.log('Expense 2 found:');
            console.log('- Status:', expense.status);
            console.log('- Receipt URL:', expense.receipt_url);
            console.log('- User:', expense.user.full_name);
        }

    } catch (error) {
        console.error('Query Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
