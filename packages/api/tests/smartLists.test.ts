import request from 'supertest';
import { app } from '../src/test/setup.js';
import { createTestUser, authRequest, createTestProject } from '../src/test/helpers.js';
import { prisma } from '../src/db/client.js';
import { addDays, subDays, startOfDay } from 'date-fns';

describe('Smart Lists API', () => {
  let user: Awaited<ReturnType<typeof createTestUser>>;
  let api: ReturnType<typeof authRequest>;
  let projectId: string;

  beforeEach(async () => {
    user = await createTestUser();
    api = authRequest(app, user.apiToken);

    // Create a project for testing
    const project = await createTestProject(user.id, { name: 'Test Project' });
    projectId = project.id;

    // Create test tasks with various properties
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 5);
    const yesterday = subDays(today, 1);
    const lastWeek = subDays(today, 7);

    await prisma.task.createMany({
      data: [
        // Inbox tasks (no project)
        { content: 'Inbox task 1', userId: user.id, priority: 4, order: 0 },
        { content: 'Inbox task 2', userId: user.id, priority: 3, order: 1 },

        // Today tasks
        { content: 'Today task 1', userId: user.id, projectId, dueDate: now, priority: 1, order: 0 },
        { content: 'Today task 2', userId: user.id, projectId, dueDate: now, priority: 2, order: 1 },

        // Upcoming tasks
        { content: 'Tomorrow task', userId: user.id, projectId, dueDate: tomorrow, priority: 3, order: 0 },
        { content: 'Next week task', userId: user.id, projectId, dueDate: nextWeek, priority: 4, order: 1 },

        // Overdue tasks
        { content: 'Overdue task 1', userId: user.id, projectId, dueDate: yesterday, priority: 1, order: 0 },
        { content: 'Overdue task 2', userId: user.id, projectId, dueDate: lastWeek, priority: 2, order: 1 },

        // No date tasks (in project)
        { content: 'No date task 1', userId: user.id, projectId, priority: 2, order: 0 },
        { content: 'No date task 2', userId: user.id, projectId, priority: 3, order: 1 },

        // Completed tasks
        { content: 'Completed task 1', userId: user.id, projectId, isCompleted: true, completedAt: now, order: 0 },
        { content: 'Completed task 2', userId: user.id, projectId, isCompleted: true, completedAt: yesterday, order: 1 }
      ]
    });
  });

  describe('GET /api/smart-lists/counts', () => {
    it('returns counts for all smart list types', async () => {
      const res = await api.get('/api/smart-lists/counts');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('inbox');
      expect(res.body).toHaveProperty('today');
      expect(res.body).toHaveProperty('upcoming');
      expect(res.body).toHaveProperty('overdue');
      expect(res.body).toHaveProperty('noDate');
      expect(res.body).toHaveProperty('completed');

      // Verify counts
      expect(res.body.inbox).toBe(2);
      expect(res.body.today).toBe(2);
      expect(res.body.upcoming).toBe(2);
      expect(res.body.overdue).toBe(2);
      expect(res.body.completed).toBe(2);
    });

    it('requires authentication', async () => {
      const res = await request(app).get('/api/smart-lists/counts');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/smart-lists/:type', () => {
    it('returns inbox tasks (no project)', async () => {
      const res = await api.get('/api/smart-lists/inbox');

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('inbox');
      expect(res.body.tasks).toHaveLength(2);
      expect(res.body.tasks.every((t: { projectId: string | null }) => t.projectId === null)).toBe(true);
    });

    it('returns today tasks', async () => {
      const res = await api.get('/api/smart-lists/today');

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('today');
      expect(res.body.tasks).toHaveLength(2);
      expect(res.body.tasks[0].content).toContain('Today');
    });

    it('returns upcoming tasks', async () => {
      const res = await api.get('/api/smart-lists/upcoming');

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('upcoming');
      expect(res.body.tasks).toHaveLength(2);
    });

    it('returns overdue tasks', async () => {
      const res = await api.get('/api/smart-lists/overdue');

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('overdue');
      expect(res.body.tasks).toHaveLength(2);
      // Most overdue first (last week before yesterday)
      expect(res.body.tasks[0].content).toBe('Overdue task 2');
    });

    it('returns no_date tasks', async () => {
      const res = await api.get('/api/smart-lists/no_date');

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('no_date');
      expect(res.body.tasks.every((t: { dueDate: Date | null }) => t.dueDate === null)).toBe(true);
    });

    it('returns priority tasks with filter', async () => {
      const res = await api.get('/api/smart-lists/priority?priority=1');

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('priority');
      expect(res.body.tasks.every((t: { priority: number }) => t.priority === 1)).toBe(true);
    });

    it('returns completed tasks', async () => {
      const res = await api.get('/api/smart-lists/completed');

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('completed');
      expect(res.body.tasks).toHaveLength(2);
      expect(res.body.tasks.every((t: { isCompleted: boolean }) => t.isCompleted === true)).toBe(true);
    });

    it('returns all incomplete tasks', async () => {
      const res = await api.get('/api/smart-lists/all');

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('all');
      expect(res.body.tasks.every((t: { isCompleted: boolean }) => t.isCompleted === false)).toBe(true);
    });

    it('supports pagination', async () => {
      const res = await api.get('/api/smart-lists/all?limit=3&offset=0');

      expect(res.status).toBe(200);
      expect(res.body.tasks).toHaveLength(3);
      expect(res.body.hasMore).toBe(true);

      // Get next page
      const res2 = await api.get('/api/smart-lists/all?limit=3&offset=3');

      expect(res2.status).toBe(200);
      expect(res2.body.tasks.length).toBeGreaterThan(0);
    });

    it('rejects invalid smart list type', async () => {
      const res = await api.get('/api/smart-lists/invalid');
      expect(res.status).toBe(400);
    });

    it('includes project and labels in response', async () => {
      const res = await api.get('/api/smart-lists/today');

      expect(res.status).toBe(200);
      expect(res.body.tasks[0]).toHaveProperty('project');
      expect(res.body.tasks[0]).toHaveProperty('labels');
    });
  });

  describe('GET /api/smart-lists/by-date', () => {
    it('returns tasks grouped by date', async () => {
      const now = new Date();
      const startDate = subDays(now, 7).toISOString().split('T')[0];
      const endDate = addDays(now, 7).toISOString().split('T')[0];

      const res = await api.get(`/api/smart-lists/by-date?startDate=${startDate}&endDate=${endDate}`);

      expect(res.status).toBe(200);
      expect(typeof res.body).toBe('object');

      // Should have tasks grouped by date keys (YYYY-MM-DD format)
      const dateKeys = Object.keys(res.body);
      if (dateKeys.length > 0) {
        expect(dateKeys[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it('requires valid date format', async () => {
      const res = await api.get('/api/smart-lists/by-date?startDate=invalid&endDate=2025-01-01');
      expect(res.status).toBe(400);
    });

    it('requires both startDate and endDate', async () => {
      const res = await api.get('/api/smart-lists/by-date?startDate=2025-01-01');
      expect(res.status).toBe(400);
    });
  });
});
