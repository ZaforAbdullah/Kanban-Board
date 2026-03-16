import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const COLUMN_COLORS = ['#49C4E5', '#8471F2', '#67E2AE'];

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo1234', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@kanban.app' },
    update: {},
    create: {
      email: 'demo@kanban.app',
      password: hashedPassword,
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create "Platform Launch" board
  const platformBoard = await prisma.board.create({
    data: {
      name: 'Platform Launch',
      userId: user.id,
      columns: {
        create: [
          {
            name: 'Todo',
            color: COLUMN_COLORS[0],
            order: 0,
            tasks: {
              create: [
                {
                  title: 'Build UI for onboarding flow',
                  description: 'Create the onboarding flow for new users.',
                  order: 0,
                  subtasks: {
                    create: [
                      { title: 'Sign up page', isCompleted: true },
                      { title: 'Sign in page', isCompleted: false },
                      { title: 'Welcome page', isCompleted: false },
                    ],
                  },
                },
                {
                  title: 'Build UI for search',
                  description: '',
                  order: 1,
                  subtasks: {
                    create: [
                      { title: 'Search page', isCompleted: false },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: 'Doing',
            color: COLUMN_COLORS[1],
            order: 1,
            tasks: {
              create: [
                {
                  title: 'Design settings and accessibility',
                  description: 'Explore settings and accessibility options.',
                  order: 0,
                  subtasks: {
                    create: [
                      { title: 'Account page', isCompleted: true },
                      { title: 'Billing page', isCompleted: true },
                    ],
                  },
                },
                {
                  title: 'Add account management endpoints',
                  description: 'Create REST or GraphQL endpoints for account management.',
                  order: 1,
                  subtasks: {
                    create: [
                      { title: 'Upgrade plan', isCompleted: true },
                      { title: 'Cancel plan', isCompleted: true },
                      { title: 'Update payment method', isCompleted: false },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: 'Done',
            color: COLUMN_COLORS[2],
            order: 2,
            tasks: {
              create: [
                {
                  title: 'Conduct 5 wireframe tests',
                  description: 'Conduct 5 wireframe tests with the marketing team.',
                  order: 0,
                  subtasks: {
                    create: [
                      { title: 'Complete 5 wireframe prototype tests', isCompleted: true },
                    ],
                  },
                },
                {
                  title: 'Create wireframe prototype',
                  description: 'Create a wireframe prototype for the Kanban board.',
                  order: 1,
                  subtasks: {
                    create: [
                      { title: 'Create clickable wireframe prototype in Figma', isCompleted: true },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`Created board: ${platformBoard.name}`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
