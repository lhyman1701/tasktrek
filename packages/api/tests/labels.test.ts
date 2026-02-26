import request from 'supertest';
import { app } from '../src/test/setup.js';
import { createTestUser, authRequest, createTestLabel } from '../src/test/helpers.js';
import { labelFixtures } from '../src/test/fixtures.js';
import { prisma } from '../src/db/client.js';
import { randomUUID } from 'crypto';

describe('Labels API', () => {
  let user: Awaited<ReturnType<typeof createTestUser>>;
  let api: ReturnType<typeof authRequest>;

  beforeEach(async () => {
    user = await createTestUser();
    api = authRequest(app, user.apiToken);
  });

  describe('POST /api/labels', () => {
    it('creates a label with valid data', async () => {
      const res = await api.post('/api/labels')
        .send(labelFixtures.valid)
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Test Label',
        color: 'green'
      });
      expect(res.body.id).toBeDefined();
    });

    it('creates a label with minimal data', async () => {
      const res = await api.post('/api/labels')
        .send(labelFixtures.minimal)
        .expect(201);

      expect(res.body.name).toBe('Minimal Label');
    });

    it('returns 400 for empty name', async () => {
      const res = await api.post('/api/labels')
        .send({ name: '' })
        .expect(400);

      expect(res.body.error).toBe('Validation Error');
    });

    it('returns 401 without auth', async () => {
      await request(app)
        .post('/api/labels')
        .send(labelFixtures.valid)
        .expect(401);
    });
  });

  describe('GET /api/labels', () => {
    it('lists user labels', async () => {
      await createTestLabel(user.id, { name: 'Label 1' });
      await createTestLabel(user.id, { name: 'Label 2' });

      const res = await api.get('/api/labels').expect(200);

      expect(res.body).toHaveLength(2);
    });

    it('does not return other users labels', async () => {
      const otherUser = await createTestUser();
      await createTestLabel(otherUser.id, { name: 'Other Label' });

      const res = await api.get('/api/labels').expect(200);

      expect(res.body).toHaveLength(0);
    });
  });

  describe('GET /api/labels/:id', () => {
    it('returns a single label', async () => {
      const label = await createTestLabel(user.id, { name: 'Test' });

      const res = await api.get(`/api/labels/${label.id}`).expect(200);

      expect(res.body.id).toBe(label.id);
      expect(res.body.name).toBe('Test');
    });

    it('returns 404 for non-existent label', async () => {
      await api.get(`/api/labels/${randomUUID()}`).expect(404);
    });

    it('returns 404 for other users label', async () => {
      const otherUser = await createTestUser();
      const label = await createTestLabel(otherUser.id, { name: 'Other' });

      await api.get(`/api/labels/${label.id}`).expect(404);
    });

    it('returns 400 for invalid UUID', async () => {
      await api.get('/api/labels/not-a-uuid').expect(400);
    });
  });

  describe('PATCH /api/labels/:id', () => {
    it('updates label name', async () => {
      const label = await createTestLabel(user.id, { name: 'Original' });

      const res = await api.patch(`/api/labels/${label.id}`)
        .send({ name: 'Updated' })
        .expect(200);

      expect(res.body.name).toBe('Updated');
    });

    it('updates label color', async () => {
      const label = await createTestLabel(user.id, { name: 'Test', color: 'green' });

      const res = await api.patch(`/api/labels/${label.id}`)
        .send({ color: 'red' })
        .expect(200);

      expect(res.body.color).toBe('red');
    });

    it('returns 404 for non-existent label', async () => {
      await api.patch(`/api/labels/${randomUUID()}`)
        .send({ name: 'Updated' })
        .expect(404);
    });

    it('returns 404 for other users label', async () => {
      const otherUser = await createTestUser();
      const label = await createTestLabel(otherUser.id, { name: 'Other' });

      await api.patch(`/api/labels/${label.id}`)
        .send({ name: 'Hacked' })
        .expect(404);
    });
  });

  describe('DELETE /api/labels/:id', () => {
    it('deletes a label', async () => {
      const label = await createTestLabel(user.id, { name: 'To Delete' });

      await api.delete(`/api/labels/${label.id}`).expect(204);

      const deleted = await prisma.label.findUnique({
        where: { id: label.id }
      });
      expect(deleted).toBeNull();
    });

    it('returns 404 for non-existent label', async () => {
      await api.delete(`/api/labels/${randomUUID()}`).expect(404);
    });

    it('returns 404 for other users label', async () => {
      const otherUser = await createTestUser();
      const label = await createTestLabel(otherUser.id, { name: 'Other' });

      await api.delete(`/api/labels/${label.id}`).expect(404);
    });
  });
});
