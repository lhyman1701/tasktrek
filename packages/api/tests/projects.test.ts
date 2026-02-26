import request from 'supertest';
import { app } from '../src/test/setup.js';
import { createTestUser, authRequest, createTestProject, createTestSection, createTestTask } from '../src/test/helpers.js';
import { projectFixtures } from '../src/test/fixtures.js';
import { prisma } from '../src/db/client.js';
import { randomUUID } from 'crypto';

describe('Projects API', () => {
  let user: Awaited<ReturnType<typeof createTestUser>>;
  let api: ReturnType<typeof authRequest>;

  beforeEach(async () => {
    user = await createTestUser();
    api = authRequest(app, user.apiToken);
  });

  describe('POST /api/projects', () => {
    it('creates a project with valid data', async () => {
      const res = await api.post('/api/projects')
        .send(projectFixtures.valid)
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Test Project',
        color: 'blue',
        isArchived: false
      });
      expect(res.body.id).toBeDefined();
    });

    it('creates a project with minimal data', async () => {
      const res = await api.post('/api/projects')
        .send(projectFixtures.minimal)
        .expect(201);

      expect(res.body.name).toBe('Minimal Project');
    });

    it('returns 400 for empty name', async () => {
      const res = await api.post('/api/projects')
        .send({ name: '' })
        .expect(400);

      expect(res.body.error).toBe('Validation Error');
    });

    it('returns 401 without auth', async () => {
      await request(app)
        .post('/api/projects')
        .send(projectFixtures.valid)
        .expect(401);
    });
  });

  describe('GET /api/projects', () => {
    it('lists user projects', async () => {
      await createTestProject(user.id, { name: 'Project 1' });
      await createTestProject(user.id, { name: 'Project 2' });

      const res = await api.get('/api/projects').expect(200);

      expect(res.body).toHaveLength(2);
    });

    it('does not return other users projects', async () => {
      const otherUser = await createTestUser();
      await createTestProject(otherUser.id, { name: 'Other Project' });

      const res = await api.get('/api/projects').expect(200);

      expect(res.body).toHaveLength(0);
    });

    it('does not return archived projects by default', async () => {
      await createTestProject(user.id, { name: 'Active' });
      const archived = await createTestProject(user.id, { name: 'Archived' });
      await prisma.project.update({
        where: { id: archived.id },
        data: { isArchived: true }
      });

      const res = await api.get('/api/projects').expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Active');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('returns a project with sections and tasks', async () => {
      const project = await createTestProject(user.id, { name: 'Test' });
      const section = await createTestSection(user.id, project.id, { name: 'Section 1' });
      await createTestTask(user.id, { content: 'Task 1', projectId: project.id, sectionId: section.id });

      const res = await api.get(`/api/projects/${project.id}`).expect(200);

      expect(res.body.id).toBe(project.id);
      expect(res.body.sections).toHaveLength(1);
      expect(res.body.sections[0].name).toBe('Section 1');
    });

    it('returns 404 for non-existent project', async () => {
      await api.get(`/api/projects/${randomUUID()}`).expect(404);
    });

    it('returns 404 for other users project', async () => {
      const otherUser = await createTestUser();
      const project = await createTestProject(otherUser.id, { name: 'Other' });

      await api.get(`/api/projects/${project.id}`).expect(404);
    });

    it('returns 400 for invalid UUID', async () => {
      await api.get('/api/projects/not-a-uuid').expect(400);
    });
  });

  describe('PATCH /api/projects/:id', () => {
    it('updates project name', async () => {
      const project = await createTestProject(user.id, { name: 'Original' });

      const res = await api.patch(`/api/projects/${project.id}`)
        .send({ name: 'Updated' })
        .expect(200);

      expect(res.body.name).toBe('Updated');
    });

    it('updates project color', async () => {
      const project = await createTestProject(user.id, { name: 'Test', color: 'blue' });

      const res = await api.patch(`/api/projects/${project.id}`)
        .send({ color: 'red' })
        .expect(200);

      expect(res.body.color).toBe('red');
    });

    it('returns 404 for non-existent project', async () => {
      await api.patch(`/api/projects/${randomUUID()}`)
        .send({ name: 'Updated' })
        .expect(404);
    });

    it('returns 404 for other users project', async () => {
      const otherUser = await createTestUser();
      const project = await createTestProject(otherUser.id, { name: 'Other' });

      await api.patch(`/api/projects/${project.id}`)
        .send({ name: 'Hacked' })
        .expect(404);
    });
  });

  describe('POST /api/projects/:id/archive', () => {
    it('archives a project', async () => {
      const project = await createTestProject(user.id, { name: 'To Archive' });

      const res = await api.post(`/api/projects/${project.id}/archive`)
        .expect(200);

      expect(res.body.isArchived).toBe(true);
    });

    it('returns 404 for non-existent project', async () => {
      await api.post(`/api/projects/${randomUUID()}/archive`).expect(404);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('deletes a project', async () => {
      const project = await createTestProject(user.id, { name: 'To Delete' });

      await api.delete(`/api/projects/${project.id}`).expect(204);

      const deleted = await prisma.project.findUnique({
        where: { id: project.id }
      });
      expect(deleted).toBeNull();
    });

    it('deletes project and its sections', async () => {
      const project = await createTestProject(user.id, { name: 'With Sections' });
      const section = await createTestSection(user.id, project.id, { name: 'Section' });

      await api.delete(`/api/projects/${project.id}`).expect(204);

      const deletedSection = await prisma.section.findUnique({
        where: { id: section.id }
      });
      expect(deletedSection).toBeNull();
    });

    it('returns 404 for non-existent project', async () => {
      await api.delete(`/api/projects/${randomUUID()}`).expect(404);
    });
  });
});
