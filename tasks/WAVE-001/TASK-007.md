# TASK-007: Build CRUD Routes (Tasks, Projects, Labels, Sections)

## Status: blocked

## Dependencies

- TASK-003: Define Prisma Schema
- TASK-005: Add Auth Middleware
- TASK-006: Add Zod Validation Middleware

## Description

Implement full CRUD operations for all entity types with proper validation, authorization, and error handling.

## Files to Create/Modify

```
packages/api/src/
├── routes/
│   ├── tasks.ts
│   ├── projects.ts
│   ├── labels.ts
│   └── sections.ts
├── services/
│   ├── taskService.ts
│   ├── projectService.ts
│   ├── labelService.ts
│   └── sectionService.ts
└── utils/
    └── pagination.ts
```

## API Endpoints

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks | List tasks (paginated, filterable) |
| GET | /api/tasks/:id | Get single task |
| POST | /api/tasks | Create task |
| PATCH | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| POST | /api/tasks/:id/complete | Mark complete |
| POST | /api/tasks/:id/reopen | Reopen task |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List projects |
| GET | /api/projects/:id | Get project with sections |
| POST | /api/projects | Create project |
| PATCH | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Archive/delete project |

### Labels

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/labels | List labels |
| POST | /api/labels | Create label |
| PATCH | /api/labels/:id | Update label |
| DELETE | /api/labels/:id | Delete label |

### Sections

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/:projectId/sections | List sections |
| POST | /api/projects/:projectId/sections | Create section |
| PATCH | /api/sections/:id | Update section |
| DELETE | /api/sections/:id | Delete section |

## Task Service Example

```typescript
// services/taskService.ts
import { prisma } from '../db/client';
import { CreateTask, UpdateTask } from '@taskflow/shared';
import { AppError } from '../middleware/errorHandler';

export async function listTasks(userId: string, filters: TaskFilters) {
  const where = {
    userId,
    isCompleted: filters.completed,
    projectId: filters.projectId,
    ...(filters.dueDate && {
      dueDate: {
        gte: filters.dueDate.start,
        lte: filters.dueDate.end
      }
    })
  };

  return prisma.task.findMany({
    where,
    include: { labels: true, project: true },
    orderBy: [{ dueDate: 'asc' }, { order: 'asc' }],
    take: filters.limit,
    skip: filters.offset
  });
}

export async function createTask(userId: string, data: CreateTask) {
  // Get next order value
  const maxOrder = await prisma.task.aggregate({
    where: { userId, projectId: data.projectId || null },
    _max: { order: true }
  });

  return prisma.task.create({
    data: {
      ...data,
      userId,
      priority: priorityToInt(data.priority),
      order: (maxOrder._max.order ?? -1) + 1,
      labels: data.labels ? {
        connect: data.labels.map(id => ({ id }))
      } : undefined
    },
    include: { labels: true, project: true }
  });
}

export async function updateTask(
  taskId: string,
  userId: string,
  data: UpdateTask
) {
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
      ...data,
      priority: data.priority ? priorityToInt(data.priority) : undefined,
      labels: data.labels ? {
        set: data.labels.map(id => ({ id }))
      } : undefined
    },
    include: { labels: true, project: true }
  });
}
```

## Route Implementation

```typescript
// routes/tasks.ts
import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import * as taskService from '../services/taskService';
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  UuidParamSchema,
  TaskQuerySchema
} from '@taskflow/shared';

const router = Router();

router.get('/',
  validateQuery(TaskQuerySchema),
  async (req, res) => {
    const tasks = await taskService.listTasks(req.user!.id, req.query);
    res.json(tasks);
  }
);

router.post('/',
  validateBody(CreateTaskSchema),
  async (req, res) => {
    const task = await taskService.createTask(req.user!.id, req.body);
    res.status(201).json(task);
  }
);

// ... more routes

export default router;
```

## Acceptance Criteria

1. [ ] All CRUD operations work for Tasks, Projects, Labels, Sections
2. [ ] Authorization checks prevent access to other users' data
3. [ ] Validation returns helpful error messages
4. [ ] Pagination works correctly
5. [ ] Filtering works (by project, date, completion status)
6. [ ] Soft delete for projects (archive)
7. [ ] Label associations work correctly
8. [ ] Order field maintained for drag-and-drop

## Verification

```bash
# Create a task
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Buy groceries", "priority": "p2"}'

# List tasks
curl http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <token>"

# Update task
curl -X PATCH http://localhost:3000/api/tasks/<id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Buy organic groceries"}'

# Complete task
curl -X POST http://localhost:3000/api/tasks/<id>/complete \
  -H "Authorization: Bearer <token>"

# Delete task
curl -X DELETE http://localhost:3000/api/tasks/<id> \
  -H "Authorization: Bearer <token>"
```

## Notes

- Always verify ownership before mutations
- Use transactions for complex operations
- Return consistent response shapes
- Include related data in responses where appropriate
