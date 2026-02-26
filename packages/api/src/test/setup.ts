// Set test environment before any imports
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://taskflow:taskflow_dev@localhost:5432/taskflow_test';

import { prisma } from '../db/client.js';
import { createApp } from '../app.js';
import { Express } from 'express';

let app: Express;

beforeAll(async () => {
  app = createApp();
});

beforeEach(async () => {
  // Clean database before each test
  // Order matters due to foreign key constraints
  await prisma.$transaction([
    prisma.task.deleteMany(),
    prisma.section.deleteMany(),
    prisma.label.deleteMany(),
    prisma.project.deleteMany(),
    prisma.user.deleteMany()
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { app };
