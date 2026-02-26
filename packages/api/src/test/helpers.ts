import request from 'supertest';
import { Express } from 'express';
import { prisma } from '../db/client.js';
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

export async function createTestProject(userId: string, data: { name: string; color?: string }) {
  return prisma.project.create({
    data: {
      name: data.name,
      color: data.color || 'blue',
      userId
    }
  });
}

export async function createTestLabel(userId: string, data: { name: string; color?: string }) {
  return prisma.label.create({
    data: {
      name: data.name,
      color: data.color || 'green',
      userId
    }
  });
}

export async function createTestSection(userId: string, projectId: string, data: { name: string; order?: number }) {
  return prisma.section.create({
    data: {
      name: data.name,
      order: data.order ?? 0,
      projectId,
      userId
    }
  });
}

export async function createTestTask(userId: string, data: { content: string; projectId?: string; sectionId?: string; order?: number }) {
  return prisma.task.create({
    data: {
      content: data.content,
      order: data.order ?? 0,
      userId,
      projectId: data.projectId,
      sectionId: data.sectionId
    }
  });
}
