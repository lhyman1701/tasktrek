import { prisma } from '../db/client.js';
import { CreateTask, UpdateTask } from '@taskflow/shared';
import { AppError } from '../middleware/errorHandler.js';
import { priorityToInt } from '../utils/priority.js';

interface TaskFilters {
  projectId?: string;
  sectionId?: string;
  completed?: boolean;
  priority?: number;
  dueBefore?: Date;
  dueAfter?: Date;
  limit?: number;
  offset?: number;
}

export async function listTasks(userId: string, filters: TaskFilters = {}) {
  const { limit = 50, offset = 0 } = filters;

  const where: Record<string, unknown> = { userId };

  if (filters.projectId !== undefined) {
    where.projectId = filters.projectId;
  }
  if (filters.sectionId !== undefined) {
    where.sectionId = filters.sectionId;
  }
  if (filters.completed !== undefined) {
    where.isCompleted = filters.completed;
  }
  if (filters.priority !== undefined) {
    where.priority = filters.priority;
  }
  if (filters.dueBefore || filters.dueAfter) {
    where.dueDate = {};
    if (filters.dueBefore) {
      (where.dueDate as Record<string, Date>).lte = filters.dueBefore;
    }
    if (filters.dueAfter) {
      (where.dueDate as Record<string, Date>).gte = filters.dueAfter;
    }
  }

  return prisma.task.findMany({
    where,
    include: { labels: true, project: true },
    orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }, { order: 'asc' }],
    take: limit,
    skip: offset
  });
}

export async function getTask(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    include: { labels: true, project: true, section: true }
  });

  if (!task) {
    throw new AppError(404, 'Task not found');
  }

  return task;
}

export async function createTask(userId: string, data: CreateTask) {
  // Get next order value
  const maxOrder = await prisma.task.aggregate({
    where: { userId, projectId: data.projectId || null },
    _max: { order: true }
  });

  return prisma.task.create({
    data: {
      content: data.content,
      description: data.description,
      userId,
      projectId: data.projectId,
      sectionId: data.sectionId,
      parentId: data.parentId,
      priority: priorityToInt(data.priority),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      order: (maxOrder._max.order ?? -1) + 1,
      labels: data.labels?.length
        ? { connect: data.labels.map(id => ({ id })) }
        : undefined
    },
    include: { labels: true, project: true }
  });
}

export async function updateTask(taskId: string, userId: string, data: UpdateTask) {
  // Verify ownership
  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId }
  });

  if (!existing) {
    throw new AppError(404, 'Task not found');
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      content: data.content,
      description: data.description,
      projectId: data.projectId,
      sectionId: data.sectionId,
      parentId: data.parentId,
      priority: data.priority ? priorityToInt(data.priority) : undefined,
      dueDate: data.dueDate !== undefined
        ? (data.dueDate ? new Date(data.dueDate) : null)
        : undefined,
      labels: data.labels
        ? { set: data.labels.map(id => ({ id })) }
        : undefined
    },
    include: { labels: true, project: true }
  });
}

export async function deleteTask(taskId: string, userId: string) {
  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId }
  });

  if (!existing) {
    throw new AppError(404, 'Task not found');
  }

  await prisma.task.delete({ where: { id: taskId } });
}

export async function completeTask(taskId: string, userId: string) {
  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId }
  });

  if (!existing) {
    throw new AppError(404, 'Task not found');
  }

  return prisma.task.update({
    where: { id: taskId },
    data: { isCompleted: true, completedAt: new Date() },
    include: { labels: true, project: true }
  });
}

export async function reopenTask(taskId: string, userId: string) {
  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId }
  });

  if (!existing) {
    throw new AppError(404, 'Task not found');
  }

  return prisma.task.update({
    where: { id: taskId },
    data: { isCompleted: false, completedAt: null },
    include: { labels: true, project: true }
  });
}
