
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing expense_report.findMany...');

    try {
        const expenses = await prisma.expense_report.findMany({
            where: {}, // Empty where should return all
            orderBy: { created_at: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        department_user_department_idTodepartment: { select: { department_name: true } },
                    },
                },
                approver: { select: { id: true, full_name: true } },
            },
        });

        console.log(`Found ${expenses.length} expenses.`);
        if (expenses.length > 0) {
            console.log('Sample expense:', JSON.stringify(expenses[0], null, 2));
        } else {
            console.log('No expenses found in DB?');
        }

    } catch (error) {
        console.error('Error fetching expenses:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
