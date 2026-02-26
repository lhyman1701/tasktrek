import { Tool } from '@anthropic-ai/sdk/resources/messages';
import { taskTools } from './taskTools.js';
import { projectTools } from './projectTools.js';
import { prisma } from '../db/client.js';
import { priorityToInt } from '../utils/priority.js';
import { TaskPriority } from '@taskflow/shared';
import { combineDateAndTime } from '../services/nlpService.js';

// Export all tools combined
export const allTools: Tool[] = [...taskTools, ...projectTools];

// Tool result type
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Execute a tool call
export async function executeToolCall(
  userId: string,
  toolName: string,
  input: Record<string, unknown>
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case 'create_task':
        return await createTask(userId, input);
      case 'complete_task':
        return await completeTask(userId, input);
      case 'reopen_task':
        return await reopenTask(userId, input);
      case 'update_task':
        return await updateTask(userId, input);
      case 'delete_task':
        return await deleteTask(userId, input);
      case 'list_tasks':
        return await listTasks(userId, input);
      case 'search_tasks':
        return await searchTasks(userId, input);
      case 'list_projects':
        return await listProjects(userId, input);
      case 'create_project':
        return await createProject(userId, input);
      case 'list_labels':
        return await listLabels(userId);
      case 'create_label':
        return await createLabel(userId, input);
      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Task operations
async function createTask(userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const content = input.content as string;
  const dueDate = input.dueDate as string | undefined;
  const dueTime = input.dueTime as string | undefined;
  const priority = input.priority as TaskPriority | undefined;
  const projectId = input.projectId as string | undefined;
  const labels = input.labels as string[] | undefined;

  const maxOrder = await prisma.task.aggregate({
    where: { userId, projectId: projectId || null },
    _max: { order: true }
  });

  const task = await prisma.task.create({
    data: {
      content,
      userId,
      projectId,
      priority: priorityToInt(priority),
      dueDate: combineDateAndTime(dueDate, dueTime),
      order: (maxOrder._max.order ?? -1) + 1,
      labels: labels?.length ? {
        connect: labels.map(id => ({ id }))
      } : undefined
    },
    include: { labels: true, project: true }
  });

  return { success: true, data: task };
}

async function completeTask(userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const taskId = input.taskId as string;

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId }
  });

  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { isCompleted: true, completedAt: new Date() }
  });

  return { success: true, data: updated };
}

async function reopenTask(userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const taskId = input.taskId as string;

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId }
  });

  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { isCompleted: false, completedAt: null }
  });

  return { success: true, data: updated };
}

async function updateTask(userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const taskId = input.taskId as string;
  const content = input.content as string | undefined;
  const dueDate = input.dueDate as string | undefined;
  const priority = input.priority as TaskPriority | undefined;

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId }
  });

  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      content,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority: priority ? priorityToInt(priority) : undefined
    }
  });

  return { success: true, data: updated };
}

async function deleteTask(userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const taskId = input.taskId as string;

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId }
  });

  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  await prisma.task.delete({ where: { id: taskId } });

  return { success: true, data: { deleted: taskId } };
}

async function listTasks(userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const filter = input.filter as string | undefined;
  const projectId = input.projectId as string | undefined;
  const limit = (input.limit as number) || 20;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const where: Record<string, unknown> = { userId };

  if (projectId) {
    where.projectId = projectId;
  }

  switch (filter) {
    case 'today':
      where.dueDate = { gte: today, lt: tomorrow };
      where.isCompleted = false;
      break;
    case 'tomorrow':
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
      where.dueDate = { gte: tomorrow, lt: dayAfterTomorrow };
      where.isCompleted = false;
      break;
    case 'upcoming':
      where.dueDate = { gte: today, lte: nextWeek };
      where.isCompleted = false;
      break;
    case 'overdue':
      where.dueDate = { lt: today };
      where.isCompleted = false;
      break;
    case 'completed':
      where.isCompleted = true;
      break;
    case 'all':
    default:
      where.isCompleted = false;
      break;
  }

  const tasks = await prisma.task.findMany({
    where,
    include: { labels: true, project: true },
    orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }, { order: 'asc' }],
    take: limit
  });

  return { success: true, data: tasks };
}

async function searchTasks(userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const query = input.query as string;
  const limit = (input.limit as number) || 10;

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      content: { contains: query, mode: 'insensitive' }
    },
    include: { labels: true, project: true },
    take: limit
  });

  return { success: true, data: tasks };
}

// Project operations
async function listProjects(userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const includeArchived = input.includeArchived as boolean | undefined;

  const projects = await prisma.project.findMany({
    where: {
      userId,
      isArchived: includeArchived ? undefined : false
    },
    orderBy: { name: 'asc' }
  });

  return { success: true, data: projects };
}

async function createProject(userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const name = input.name as string;
  const color = input.color as string | undefined;

  const project = await prisma.project.create({
    data: { name, color, userId }
  });

  return { success: true, data: project };
}

// Label operations
async function listLabels(userId: string): Promise<ToolResult> {
  const labels = await prisma.label.findMany({
    where: { userId },
    orderBy: { name: 'asc' }
  });

  return { success: true, data: labels };
}

async function createLabel(userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const name = input.name as string;
  const color = input.color as string | undefined;

  const label = await prisma.label.create({
    data: { name, color, userId }
  });

  return { success: true, data: label };
}
