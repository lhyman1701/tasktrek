# TASK-009: Write Unit Tests for All Endpoints

## Status: blocked

## Dependencies

- TASK-007: Build CRUD Routes

## Description

Write comprehensive unit tests for all API endpoints using Jest with test database isolation.

## Files to Create/Modify

```
packages/api/
├── jest.config.js
├── package.json             # Add test scripts
├── src/
│   └── test/
│       ├── setup.ts         # Test setup
│       ├── helpers.ts       # Test utilities
│       └── fixtures.ts      # Test data factories
└── tests/
    ├── tasks.test.ts
    ├── projects.test.ts
    ├── labels.test.ts
    ├── sections.test.ts
    └── auth.test.ts
```

## Jest Configuration

```javascript
// jest.config.js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/test/**',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## Test Setup

```typescript
// src/test/setup.ts
import { prisma } from '../db/client';
import { createApp } from '../app';
import { Express } from 'express';

let app: Express;

beforeAll(async () => {
  app = createApp();
});

beforeEach(async () => {
  // Clean database before each test
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
```

## Test Helpers

```typescript
// src/test/helpers.ts
import request from 'supertest';
import { Express } from 'express';
import { prisma } from '../db/client';
import { randomUUID } from 'crypto';

export async function createTestUser() {
  return prisma.user.create({
    data: {
      email: `test-${randomUUID()}@example.com`,
      name: 'Test User',
      apiToken: randomUUID()
    }
  });
}

export function authRequest(app: Express, token: string) {
  return {
    get: (url: string) =>
      request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) =>
      request(app).post(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) =>
      request(app).patch(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) =>
      request(app).delete(url).set('Authorization', `Bearer ${token}`)
  };
}
```

## Test Fixtures

```typescript
// src/test/fixtures.ts
export const taskFixtures = {
  valid: {
    content: 'Test task',
    priority: 'p2',
    description: 'Test description'
  },
  withDueDate: {
    content: 'Task with due date',
    dueDate: new Date().toISOString()
  },
  minimal: {
    content: 'Minimal task'
  }
};

export const projectFixtures = {
  valid: {
    name: 'Test Project',
    color: 'blue'
  }
};
```

## Example Test File

```typescript
// tests/tasks.test.ts
import { app } from '../src/test/setup';
import { createTestUser, authRequest } from '../src/test/helpers';
import { taskFixtures } from '../src/test/fixtures';
import { prisma } from '../src/db/client';

describe('Tasks API', () => {
  let user: { id: string; apiToken: string };
  let api: ReturnType<typeof authRequest>;

  beforeEach(async () => {
    user = await createTestUser();
    api = authRequest(app, user.apiToken);
  });

  describe('POST /api/tasks', () => {
    it('creates a task with valid data', async () => {
      const res = await api.post('/api/tasks')
        .send(taskFixtures.valid)
        .expect(201);

      expect(res.body).toMatchObject({
        content: 'Test task',
        priority: 2,
        isCompleted: false
      });
      expect(res.body.id).toBeDefined();
    });

    it('returns 400 for empty content', async () => {
      const res = await api.post('/api/tasks')
        .send({ content: '' })
        .expect(400);

      expect(res.body.error).toBe('Validation Error');
    });

    it('returns 401 without auth', async () => {
      await request(app)
        .post('/api/tasks')
        .send(taskFixtures.valid)
        .expect(401);
    });
  });

  describe('GET /api/tasks', () => {
    it('lists user tasks', async () => {
      // Create test tasks
      await prisma.task.createMany({
        data: [
          { content: 'Task 1', userId: user.id, order: 0 },
          { content: 'Task 2', userId: user.id, order: 1 }
        ]
      });

      const res = await api.get('/api/tasks').expect(200);

      expect(res.body).toHaveLength(2);
    });

    it('does not return other users tasks', async () => {
      const otherUser = await createTestUser();
      await prisma.task.create({
        data: { content: 'Other task', userId: otherUser.id, order: 0 }
      });

      const res = await api.get('/api/tasks').expect(200);

      expect(res.body).toHaveLength(0);
    });

    it('filters by completion status', async () => {
      await prisma.task.createMany({
        data: [
          { content: 'Incomplete', userId: user.id, order: 0 },
          { content: 'Complete', userId: user.id, order: 1, isCompleted: true }
        ]
      });

      const res = await api.get('/api/tasks?completed=false').expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].content).toBe('Incomplete');
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('updates task content', async () => {
      const task = await prisma.task.create({
        data: { content: 'Original', userId: user.id, order: 0 }
      });

      const res = await api.patch(`/api/tasks/${task.id}`)
        .send({ content: 'Updated' })
        .expect(200);

      expect(res.body.content).toBe('Updated');
    });

    it('returns 404 for non-existent task', async () => {
      await api.patch('/api/tasks/non-existent-uuid')
        .send({ content: 'Updated' })
        .expect(404);
    });

    it('returns 404 for other users task', async () => {
      const otherUser = await createTestUser();
      const task = await prisma.task.create({
        data: { content: 'Other', userId: otherUser.id, order: 0 }
      });

      await api.patch(`/api/tasks/${task.id}`)
        .send({ content: 'Hacked' })
        .expect(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('deletes a task', async () => {
      const task = await prisma.task.create({
        data: { content: 'To delete', userId: user.id, order: 0 }
      });

      await api.delete(`/api/tasks/${task.id}`).expect(204);

      const deleted = await prisma.task.findUnique({
        where: { id: task.id }
      });
      expect(deleted).toBeNull();
    });
  });

  describe('POST /api/tasks/:id/complete', () => {
    it('marks task as complete', async () => {
      const task = await prisma.task.create({
        data: { content: 'Incomplete', userId: user.id, order: 0 }
      });

      const res = await api.post(`/api/tasks/${task.id}/complete`)
        .expect(200);

      expect(res.body.isCompleted).toBe(true);
    });
  });
});
```

## Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --runInBand"
  }
}
```

## Acceptance Criteria

1. [ ] Jest configured with TypeScript support
2. [ ] Test database isolation (clean between tests)
3. [ ] Tests for all CRUD operations on all entities
4. [ ] Tests for authentication (valid/invalid/missing)
5. [ ] Tests for authorization (user can't access others' data)
6. [ ] Tests for validation errors
7. [ ] Tests for edge cases (not found, duplicate, etc.)
8. [ ] 80%+ code coverage

## Verification

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tasks.test.ts

# Run in watch mode
npm run test:watch
```

## Test Coverage Requirements

| Area | Min Coverage |
|------|-------------|
| Routes | 90% |
| Services | 85% |
| Middleware | 80% |
| Overall | 80% |

## Notes

- Use test database (separate from dev)
- Each test should be independent
- Clean up in beforeEach, not afterEach
- Test both happy path and error cases
- Use meaningful test descriptions
