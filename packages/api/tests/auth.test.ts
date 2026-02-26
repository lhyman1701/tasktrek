import request from 'supertest';
import { app } from '../src/test/setup.js';
import { createTestUser } from '../src/test/helpers.js';
import { randomUUID } from 'crypto';

describe('Authentication', () => {
  describe('Auth Middleware', () => {
    it('returns 401 without Authorization header', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .expect(401);

      expect(res.body.error).toBe('Missing or invalid authorization header');
    });

    it('returns 401 with invalid Authorization format', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(res.body.error).toBe('Missing or invalid authorization header');
    });

    it('returns 401 with non-existent token', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${randomUUID()}`)
        .expect(401);

      expect(res.body.error).toBe('Invalid API token');
    });

    it('allows access with valid token', async () => {
      const user = await createTestUser();

      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${user.apiToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('sets req.user with valid token', async () => {
      const user = await createTestUser();

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user.apiToken}`)
        .send({ content: 'Test task' })
        .expect(201);

      expect(res.body.userId).toBe(user.id);
    });
  });

  describe('Public Routes', () => {
    it('health check is accessible without auth', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);

      expect(res.body.status).toBe('healthy');
    });
  });

  describe('Error Handling', () => {
    it('returns 404 for non-existent routes', async () => {
      const user = await createTestUser();

      const res = await request(app)
        .get('/api/non-existent-route')
        .set('Authorization', `Bearer ${user.apiToken}`)
        .expect(404);

      expect(res.body.error).toBe('Not Found');
    });

    it('returns 404 for completely unknown routes', async () => {
      const res = await request(app)
        .get('/completely-unknown')
        .expect(404);

      expect(res.body.error).toBe('Not Found');
    });
  });
});
