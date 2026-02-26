# TASK-015: Implement Smart List Queries

## Status: blocked

## Dependencies

- WAVE-001 complete

## Description

Create predefined smart list queries for common task views (Today, Upcoming, Overdue, etc.).

## Implementation

```typescript
// services/smartListService.ts
import { prisma } from '../db/client';
import { startOfDay, endOfDay, addDays, startOfWeek, endOfWeek } from 'date-fns';

export type SmartListType =
  | 'inbox'
  | 'today'
  | 'upcoming'
  | 'overdue'
  | 'no_date'
  | 'priority'
  | 'completed'
  | 'all';

interface SmartListOptions {
  limit?: number;
  offset?: number;
  includeCompleted?: boolean;
}

export async function getSmartList(
  userId: string,
  listType: SmartListType,
  options: SmartListOptions = {}
) {
  const { limit = 50, offset = 0, includeCompleted = false } = options;
  const now = new Date();

  const baseWhere = {
    userId,
    isCompleted: includeCompleted ? undefined : false
  };

  const queries: Record<SmartListType, object> = {
    inbox: {
      ...baseWhere,
      projectId: null
    },
    today: {
      ...baseWhere,
      dueDate: {
        gte: startOfDay(now),
        lte: endOfDay(now)
      }
    },
    upcoming: {
      ...baseWhere,
      dueDate: {
        gt: endOfDay(now),
        lte: addDays(now, 7)
      }
    },
    overdue: {
      ...baseWhere,
      dueDate: {
        lt: startOfDay(now)
      }
    },
    no_date: {
      ...baseWhere,
      dueDate: null
    },
    priority: {
      ...baseWhere,
      priority: { in: [1, 2] }
    },
    completed: {
      userId,
      isCompleted: true
    },
    all: baseWhere
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where: queries[listType],
      include: { labels: true, project: true },
      orderBy: [
        { priority: 'asc' },
        { dueDate: 'asc' },
        { order: 'asc' }
      ],
      take: limit,
      skip: offset
    }),
    prisma.task.count({ where: queries[listType] })
  ]);

  return {
    tasks,
    total,
    listType,
    meta: getListMeta(listType, now)
  };
}

function getListMeta(listType: SmartListType, now: Date) {
  const metas: Record<SmartListType, object> = {
    inbox: { title: 'Inbox', icon: 'inbox' },
    today: {
      title: 'Today',
      icon: 'calendar',
      date: now.toISOString()
    },
    upcoming: {
      title: 'Upcoming',
      icon: 'calendar-days',
      dateRange: {
        start: addDays(now, 1).toISOString(),
        end: addDays(now, 7).toISOString()
      }
    },
    overdue: { title: 'Overdue', icon: 'alert-circle' },
    no_date: { title: 'No Date', icon: 'calendar-off' },
    priority: { title: 'Priority', icon: 'flag' },
    completed: { title: 'Completed', icon: 'check-circle' },
    all: { title: 'All Tasks', icon: 'list' }
  };
  return metas[listType];
}

// Get counts for sidebar
export async function getSmartListCounts(userId: string) {
  const now = new Date();

  const [inbox, today, upcoming, overdue] = await Promise.all([
    prisma.task.count({
      where: { userId, isCompleted: false, projectId: null }
    }),
    prisma.task.count({
      where: {
        userId,
        isCompleted: false,
        dueDate: { gte: startOfDay(now), lte: endOfDay(now) }
      }
    }),
    prisma.task.count({
      where: {
        userId,
        isCompleted: false,
        dueDate: { gt: endOfDay(now), lte: addDays(now, 7) }
      }
    }),
    prisma.task.count({
      where: {
        userId,
        isCompleted: false,
        dueDate: { lt: startOfDay(now) }
      }
    })
  ]);

  return { inbox, today, upcoming, overdue };
}
```

## Routes

```typescript
// routes/smartLists.ts
router.get('/:listType', async (req, res) => {
  const result = await getSmartList(
    req.user!.id,
    req.params.listType as SmartListType,
    req.query
  );
  res.json(result);
});

router.get('/counts', async (req, res) => {
  const counts = await getSmartListCounts(req.user!.id);
  res.json(counts);
});
```

## Acceptance Criteria

1. [ ] Today shows tasks due today
2. [ ] Upcoming shows next 7 days
3. [ ] Overdue shows past due tasks
4. [ ] Inbox shows tasks without project
5. [ ] Counts endpoint for sidebar badges
6. [ ] Pagination support
7. [ ] Proper sorting (priority, due date, order)
