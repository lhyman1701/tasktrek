import { prisma } from '../db/client.js';
import { CreateProject, UpdateProject } from '@taskflow/shared';
import { AppError } from '../middleware/errorHandler.js';

export async function listProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId, isArchived: false },
    include: {
      sections: { orderBy: { order: 'asc' } },
      _count: {
        select: {
          tasks: { where: { isCompleted: false } }
        }
      }
    },
    orderBy: [{ isFavorite: 'desc' }, { order: 'asc' }]
  });
}

export async function getProject(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    include: {
      sections: { orderBy: { order: 'asc' } },
      tasks: {
        where: { isCompleted: false },
        orderBy: { order: 'asc' },
        include: { labels: true }
      }
    }
  });

  if (!project) {
    throw new AppError(404, 'Project not found');
  }

  return project;
}

export async function createProject(userId: string, data: CreateProject) {
  const maxOrder = await prisma.project.aggregate({
    where: { userId },
    _max: { order: true }
  });

  return prisma.project.create({
    data: {
      name: data.name,
      color: data.color || 'charcoal',
      isFavorite: data.isFavorite || false,
      parentId: data.parentId,
      userId,
      order: (maxOrder._max.order ?? -1) + 1
    },
    include: { sections: true }
  });
}

export async function updateProject(projectId: string, userId: string, data: UpdateProject) {
  const existing = await prisma.project.findFirst({
    where: { id: projectId, userId }
  });

  if (!existing) {
    throw new AppError(404, 'Project not found');
  }

  return prisma.project.update({
    where: { id: projectId },
    data: {
      name: data.name,
      color: data.color,
      isFavorite: data.isFavorite,
      parentId: data.parentId
    },
    include: { sections: true }
  });
}

export async function archiveProject(projectId: string, userId: string) {
  const existing = await prisma.project.findFirst({
    where: { id: projectId, userId }
  });

  if (!existing) {
    throw new AppError(404, 'Project not found');
  }

  return prisma.project.update({
    where: { id: projectId },
    data: { isArchived: true }
  });
}

export async function deleteProject(projectId: string, userId: string) {
  const existing = await prisma.project.findFirst({
    where: { id: projectId, userId }
  });

  if (!existing) {
    throw new AppError(404, 'Project not found');
  }

  await prisma.project.delete({ where: { id: projectId } });
}
