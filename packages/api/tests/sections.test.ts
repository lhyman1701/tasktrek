import request from 'supertest';
import { app } from '../src/test/setup.js';
import { createTestUser, authRequest, createTestProject, createTestSection } from '../src/test/helpers.js';
import { sectionFixtures } from '../src/test/fixtures.js';
import { prisma } from '../src/db/client.js';
import { randomUUID } from 'crypto';

describe('Sections API', () => {
  let user: Awaited<ReturnType<typeof createTestUser>>;
  let api: ReturnType<typeof authRequest>;
  let project: Awaited<ReturnType<typeof createTestProject>>;

  beforeEach(async () => {
    user = await createTestUser();
    api = authRequest(app, user.apiToken);
    project = await createTestProject(user.id, { name: 'Test Project' });
  });

  describe('POST /api/projects/:projectId/sections', () => {
    it('creates a section with valid data', async () => {
      const res = await api.post(`/api/projects/${project.id}/sections`)
        .send(sectionFixtures.valid)
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Test Section',
        projectId: project.id
      });
      expect(res.body.id).toBeDefined();
    });

    it('returns 400 for empty name', async () => {
      const res = await api.post(`/api/projects/${project.id}/sections`)
        .send({ name: '' })
        .expect(400);

      expect(res.body.error).toBe('Validation Error');
    });

    it('returns 404 for non-existent project', async () => {
      await api.post(`/api/projects/${randomUUID()}/sections`)
        .send(sectionFixtures.valid)
        .expect(404);
    });

    it('returns 404 for other users project', async () => {
      const otherUser = await createTestUser();
      const otherProject = await createTestProject(otherUser.id, { name: 'Other' });

      await api.post(`/api/projects/${otherProject.id}/sections`)
        .send(sectionFixtures.valid)
        .expect(404);
    });

    it('returns 401 without auth', async () => {
      await request(app)
        .post(`/api/projects/${project.id}/sections`)
        .send(sectionFixtures.valid)
        .expect(401);
    });
  });

  describe('GET /api/projects/:projectId/sections', () => {
    it('lists project sections', async () => {
      await createTestSection(user.id, project.id, { name: 'Section 1', order: 0 });
      await createTestSection(user.id, project.id, { name: 'Section 2', order: 1 });

      const res = await api.get(`/api/projects/${project.id}/sections`).expect(200);

      expect(res.body).toHaveLength(2);
    });

    it('returns sections in order', async () => {
      await createTestSection(user.id, project.id, { name: 'Second', order: 1 });
      await createTestSection(user.id, project.id, { name: 'First', order: 0 });

      const res = await api.get(`/api/projects/${project.id}/sections`).expect(200);

      expect(res.body[0].name).toBe('First');
      expect(res.body[1].name).toBe('Second');
    });

    it('returns 404 for non-existent project', async () => {
      await api.get(`/api/projects/${randomUUID()}/sections`).expect(404);
    });

    it('returns 404 for other users project', async () => {
      const otherUser = await createTestUser();
      const otherProject = await createTestProject(otherUser.id, { name: 'Other' });

      await api.get(`/api/projects/${otherProject.id}/sections`).expect(404);
    });
  });

  describe('GET /api/sections/:id', () => {
    it('returns a single section', async () => {
      const section = await createTestSection(user.id, project.id, { name: 'Test' });

      const res = await api.get(`/api/sections/${section.id}`).expect(200);

      expect(res.body.id).toBe(section.id);
      expect(res.body.name).toBe('Test');
    });

    it('returns 404 for non-existent section', async () => {
      await api.get(`/api/sections/${randomUUID()}`).expect(404);
    });

    it('returns 404 for other users section', async () => {
      const otherUser = await createTestUser();
      const otherProject = await createTestProject(otherUser.id, { name: 'Other' });
      const otherSection = await createTestSection(otherUser.id, otherProject.id, { name: 'Other' });

      await api.get(`/api/sections/${otherSection.id}`).expect(404);
    });

    it('returns 400 for invalid UUID', async () => {
      await api.get('/api/sections/not-a-uuid').expect(400);
    });
  });

  describe('PATCH /api/sections/:id', () => {
    it('updates section name', async () => {
      const section = await createTestSection(user.id, project.id, { name: 'Original' });

      const res = await api.patch(`/api/sections/${section.id}`)
        .send({ name: 'Updated' })
        .expect(200);

      expect(res.body.name).toBe('Updated');
    });

    it('updates section order', async () => {
      const section = await createTestSection(user.id, project.id, { name: 'Test', order: 0 });

      const res = await api.patch(`/api/sections/${section.id}`)
        .send({ order: 5 })
        .expect(200);

      expect(res.body.order).toBe(5);
    });

    it('returns 404 for non-existent section', async () => {
      await api.patch(`/api/sections/${randomUUID()}`)
        .send({ name: 'Updated' })
        .expect(404);
    });

    it('returns 404 for other users section', async () => {
      const otherUser = await createTestUser();
      const otherProject = await createTestProject(otherUser.id, { name: 'Other' });
      const otherSection = await createTestSection(otherUser.id, otherProject.id, { name: 'Other' });

      await api.patch(`/api/sections/${otherSection.id}`)
        .send({ name: 'Hacked' })
        .expect(404);
    });
  });

  describe('DELETE /api/sections/:id', () => {
    it('deletes a section', async () => {
      const section = await createTestSection(user.id, project.id, { name: 'To Delete' });

      await api.delete(`/api/sections/${section.id}`).expect(204);

      const deleted = await prisma.section.findUnique({
        where: { id: section.id }
      });
      expect(deleted).toBeNull();
    });

    it('returns 404 for non-existent section', async () => {
      await api.delete(`/api/sections/${randomUUID()}`).expect(404);
    });

    it('returns 404 for other users section', async () => {
      const otherUser = await createTestUser();
      const otherProject = await createTestProject(otherUser.id, { name: 'Other' });
      const otherSection = await createTestSection(otherUser.id, otherProject.id, { name: 'Other' });

      await api.delete(`/api/sections/${otherSection.id}`).expect(404);
    });
  });
});
