import { prisma } from '../db/client.js';
import {
  addDays,
  format,
  startOfDay,
  endOfDay
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

// Get start of day in user's timezone, returned as UTC Date
function startOfDayInTz(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone);
  zonedDate.setHours(0, 0, 0, 0);
  return fromZonedTime(zonedDate, timezone);
}

// Get end of day in user's timezone, returned as UTC Date
function endOfDayInTz(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone);
  zonedDate.setHours(23, 59, 59, 999);
  return fromZonedTime(zonedDate, timezone);
}

// Get end of week (Sunday) in user's timezone
function endOfWeekInTz(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone);
  const day = zonedDate.getDay();
  const diff = 7 - day; // days until Sunday
  zonedDate.setDate(zonedDate.getDate() + diff);
  zonedDate.setHours(23, 59, 59, 999);
  return fromZonedTime(zonedDate, timezone);
}

export type SmartListType =
  | 'inbox'
  | 'today'
  | 'upcoming'
  | 'overdue'
  | 'no_date'
  | 'priority'
  | 'completed'
  | 'all';

export interface SmartListOptions {
  type: SmartListType;
  priority?: number; // For priority filter (1-4)
  projectId?: string; // Filter by project
  limit?: number;
  offset?: number;
  timezone?: string; // User's timezone (e.g., 'America/Los_Angeles')
}

export interface SmartListTask {
  id: string;
  content: string;
  description: string | null;
  priority: number;
  isCompleted: boolean;
  completedAt: Date | null;
  dueDate: Date | null;
  order: number;
  projectId: string | null;
  sectionId: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  project: { id: string; name: string; color: string } | null;
  labels: { id: string; name: string; color: string }[];
}

export interface SmartListResult {
  type: SmartListType;
  tasks: SmartListTask[];
  total: number;
  hasMore: boolean;
}

export interface SmartListCounts {
  inbox: number;
  today: number;
  upcoming: number;
  overdue: number;
  noDate: number;
  completed: number;
}

/**
 * Get tasks for a smart list
 */
export async function getSmartList(
  userId: string,
  options: SmartListOptions
): Promise<SmartListResult> {
  const { type, priority, projectId, limit = 50, offset = 0, timezone = 'UTC' } = options;

  const now = new Date();
  const todayStart = startOfDayInTz(now, timezone);
  const todayEnd = endOfDayInTz(now, timezone);
  const weekEnd = endOfWeekInTz(now, timezone);
  const nextWeekEnd = addDays(weekEnd, 7);

  // Build where clause based on smart list type
  const where: Record<string, unknown> = { userId };

  // Apply project filter if provided
  if (projectId) {
    where.projectId = projectId;
  }

  switch (type) {
    case 'inbox':
      // Tasks without a project
      where.projectId = null;
      where.isCompleted = false;
      break;

    case 'today':
      // Tasks due today (completed or not)
      where.dueDate = {
        gte: todayStart,
        lte: todayEnd
      };
      where.isCompleted = false;
      break;

    case 'upcoming':
      // Tasks due in the next 7 days (excluding today)
      where.dueDate = {
        gt: todayEnd,
        lte: nextWeekEnd
      };
      where.isCompleted = false;
      break;

    case 'overdue':
      // Tasks past due date and not completed
      where.dueDate = {
        lt: todayStart
      };
      where.isCompleted = false;
      break;

    case 'no_date':
      // Tasks without a due date
      where.dueDate = null;
      where.isCompleted = false;
      break;

    case 'priority':
      // Tasks with specific priority (or high priority by default)
      where.priority = priority ?? 1;
      where.isCompleted = false;
      break;

    case 'completed':
      // Completed tasks
      where.isCompleted = true;
      break;

    case 'all':
    default:
      // All incomplete tasks
      where.isCompleted = false;
      break;
  }

  // Get total count for pagination
  const total = await prisma.task.count({ where });

  // Get tasks with includes
  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: {
        select: { id: true, name: true, color: true }
      },
      labels: {
        select: { id: true, name: true, color: true }
      }
    },
    orderBy: getOrderBy(type),
    take: limit,
    skip: offset
  });

  return {
    type,
    tasks,
    total,
    hasMore: offset + tasks.length < total
  };
}

/**
 * Get counts for all smart lists (for sidebar badges)
 */
export async function getSmartListCounts(userId: string, timezone: string = 'UTC'): Promise<SmartListCounts> {
  const now = new Date();
  const todayStart = startOfDayInTz(now, timezone);
  const todayEnd = endOfDayInTz(now, timezone);
  const weekEnd = endOfWeekInTz(now, timezone);
  const nextWeekEnd = addDays(weekEnd, 7);

  // Run all counts in parallel
  const [inbox, today, upcoming, overdue, noDate, completed] = await Promise.all([
    // Inbox: no project
    prisma.task.count({
      where: { userId, projectId: null, isCompleted: false }
    }),

    // Today: due today
    prisma.task.count({
      where: {
        userId,
        dueDate: { gte: todayStart, lte: todayEnd },
        isCompleted: false
      }
    }),

    // Upcoming: next 7 days (excluding today)
    prisma.task.count({
      where: {
        userId,
        dueDate: { gt: todayEnd, lte: nextWeekEnd },
        isCompleted: false
      }
    }),

    // Overdue: past due
    prisma.task.count({
      where: {
        userId,
        dueDate: { lt: todayStart },
        isCompleted: false
      }
    }),

    // No date
    prisma.task.count({
      where: { userId, dueDate: null, isCompleted: false }
    }),

    // Completed
    prisma.task.count({
      where: { userId, isCompleted: true }
    })
  ]);

  return {
    inbox,
    today,
    upcoming,
    overdue,
    noDate,
    completed
  };
}

/**
 * Get order by clause for smart list type
 */
function getOrderBy(type: SmartListType): { [key: string]: 'asc' | 'desc' }[] {
  switch (type) {
    case 'today':
    case 'upcoming':
      // Sort by due date, then priority
      return [{ dueDate: 'asc' }, { priority: 'asc' }, { order: 'asc' }];

    case 'overdue':
      // Most overdue first
      return [{ dueDate: 'asc' }, { priority: 'asc' }];

    case 'completed':
      // Most recently completed first
      return [{ completedAt: 'desc' }];

    case 'priority':
      // By priority then due date
      return [{ priority: 'asc' }, { dueDate: 'asc' }, { order: 'asc' }];

    default:
      // Default: priority, then due date, then order
      return [{ priority: 'asc' }, { dueDate: 'asc' }, { order: 'asc' }];
  }
}

/**
 * Group tasks by date for calendar-like views
 */
export async function getTasksByDate(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Map<string, SmartListTask[]>> {
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      dueDate: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate)
      },
      isCompleted: false
    },
    include: {
      project: {
        select: { id: true, name: true, color: true }
      },
      labels: {
        select: { id: true, name: true, color: true }
      }
    },
    orderBy: [{ dueDate: 'asc' }, { priority: 'asc' }, { order: 'asc' }]
  });

  // Group by date string (YYYY-MM-DD)
  const grouped = new Map<string, SmartListTask[]>();

  for (const task of tasks) {
    if (task.dueDate) {
      const dateKey = format(task.dueDate, 'yyyy-MM-dd');
      const existing = grouped.get(dateKey) || [];
      existing.push(task);
      grouped.set(dateKey, existing);
    }
  }

  return grouped;
}
