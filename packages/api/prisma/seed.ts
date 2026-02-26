import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Use fixed UUIDs for seeded data so they're predictable
const SAMPLE_PROJECT_ID = '00000000-0000-0000-0000-000000000001';
const SAMPLE_TASK_ID = '00000000-0000-0000-0000-000000000002';

async function main() {
  // Clean up old non-UUID records first
  console.log('Cleaning up old records...');
  await prisma.task.deleteMany({ where: { id: 'sample-task-id' } }).catch(() => {});
  await prisma.project.deleteMany({ where: { id: 'sample-project-id' } }).catch(() => {});

  // Create a test user with a known API token
  const testUser = await prisma.user.upsert({
    where: { email: 'test@taskflow.dev' },
    update: {},
    create: {
      email: 'test@taskflow.dev',
      name: 'Test User',
      apiToken: 'test-api-token-12345'
    }
  });

  console.log('Created test user:', testUser);

  // Create a sample project
  const project = await prisma.project.upsert({
    where: { id: SAMPLE_PROJECT_ID },
    update: {},
    create: {
      id: SAMPLE_PROJECT_ID,
      name: 'Getting Started',
      color: 'blue',
      userId: testUser.id
    }
  });

  console.log('Created sample project:', project);

  // Create a sample task
  const task = await prisma.task.upsert({
    where: { id: SAMPLE_TASK_ID },
    update: {},
    create: {
      id: SAMPLE_TASK_ID,
      content: 'Welcome to TaskFlow!',
      description: 'This is your first task. Try the AI chat to manage tasks with natural language.',
      priority: 1,
      userId: testUser.id,
      projectId: project.id
    }
  });

  console.log('Created sample task:', task);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
