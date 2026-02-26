import request from 'supertest';
import { app } from '../src/test/setup.js';
import { createTestUser, authRequest, createTestProject } from '../src/test/helpers.js';
import { taskFixtures } from '../src/test/fixtures.js';
import { prisma } from '../src/db/client.js';
import { randomUUID } from 'crypto';

describe('Tasks API', () => {
  let user: Awaited<ReturnType<typeof createTestUser>>;
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

    it('creates a task with minimal data', async () => {
      const res = await api.post('/api/tasks')
        .send(taskFixtures.minimal)
        .expect(201);

      expect(res.body.content).toBe('Minimal task');
      expect(res.body.priority).toBe(4); // default priority
    });

    it('creates a task in a project', async () => {
      const project = await createTestProject(user.id, { name: 'Test Project' });

      const res = await api.post('/api/tasks')
        .send({ ...taskFixtures.minimal, projectId: project.id })
        .expect(201);

      expect(res.body.projectId).toBe(project.id);
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

    it('filters by project', async () => {
      const project = await createTestProject(user.id, { name: 'Test Project' });
      await prisma.task.createMany({
        data: [
          { content: 'In project', userId: user.id, order: 0, projectId: project.id },
          { content: 'No project', userId: user.id, order: 1 }
        ]
      });

      const res = await api.get(`/api/tasks?projectId=${project.id}`).expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].content).toBe('In project');
    });

    it('supports pagination', async () => {
      await prisma.task.createMany({
        data: Array.from({ length: 5 }, (_, i) => ({
          content: `Task ${i}`,
          userId: user.id,
          order: i
        }))
      });

      const res = await api.get('/api/tasks?limit=2&offset=2').expect(200);

      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('returns a single task', async () => {
      const task = await prisma.task.create({
        data: { content: 'Test', userId: user.id, order: 0 }
      });

      const res = await api.get(`/api/tasks/${task.id}`).expect(200);

      expect(res.body.id).toBe(task.id);
      expect(res.body.content).toBe('Test');
    });

    it('returns 404 for non-existent task', async () => {
      await api.get(`/api/tasks/${randomUUID()}`).expect(404);
    });

    it('returns 404 for other users task', async () => {
      const otherUser = await createTestUser();
      const task = await prisma.task.create({
        data: { content: 'Other', userId: otherUser.id, order: 0 }
      });

      await api.get(`/api/tasks/${task.id}`).expect(404);
    });

    it('returns 400 for invalid UUID', async () => {
      await api.get('/api/tasks/not-a-uuid').expect(400);
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

    it('updates task priority', async () => {
      const task = await prisma.task.create({
        data: { content: 'Test', userId: user.id, order: 0 }
      });

      const res = await api.patch(`/api/tasks/${task.id}`)
        .send({ priority: 'p1' })
        .expect(200);

      expect(res.body.priority).toBe(1);
    });

    it('returns 404 for non-existent task', async () => {
      await api.patch(`/api/tasks/${randomUUID()}`)
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

    it('returns 404 for non-existent task', async () => {
      await api.delete(`/api/tasks/${randomUUID()}`).expect(404);
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
      expect(res.body.completedAt).toBeDefined();
    });

    it('returns 404 for non-existent task', async () => {
      await api.post(`/api/tasks/${randomUUID()}/complete`).expect(404);
    });
  });

  describe('POST /api/tasks/:id/reopen', () => {
    it('reopens a completed task', async () => {
      const task = await prisma.task.create({
        data: {
          content: 'Complete',
          userId: user.id,
          order: 0,
          isCompleted: true,
          completedAt: new Date()
        }
      });

      const res = await api.post(`/api/tasks/${task.id}/reopen`)
        .expect(200);

      expect(res.body.isCompleted).toBe(false);
      expect(res.body.completedAt).toBeNull();
    });
  });
});
