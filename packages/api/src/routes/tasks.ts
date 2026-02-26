import { Router, Request, Response, NextFunction } from 'express';
import { validate, validateBody, validateParams } from '../middleware/validate.js';
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  UuidParamSchema,
  TaskQuerySchema
} from '@taskflow/shared';
import * as taskService from '../services/taskService.js';

const router = Router();

// Async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// GET /tasks - List tasks
router.get('/',
  validate({ query: TaskQuerySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const tasks = await taskService.listTasks(req.user!.id, {
      projectId: req.query.projectId as string | undefined,
      sectionId: req.query.sectionId as string | undefined,
      completed: req.query.completed as boolean | undefined,
      limit: req.query.limit as number | undefined,
      offset: req.query.offset as number | undefined
    });
    res.json(tasks);
  })
);

// GET /tasks/:id - Get single task
router.get('/:id',
  validateParams(UuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.getTask(req.params.id, req.user!.id);
    res.json(task);
  })
);

// POST /tasks - Create task
router.post('/',
  validateBody(CreateTaskSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.createTask(req.user!.id, req.body);
    res.status(201).json(task);
  })
);

// PATCH /tasks/:id - Update task
router.patch('/:id',
  validate({
    params: UuidParamSchema,
    body: UpdateTaskSchema
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.updateTask(req.params.id, req.user!.id, req.body);
    res.json(task);
  })
);

// DELETE /tasks/:id - Delete task
router.delete('/:id',
  validateParams(UuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await taskService.deleteTask(req.params.id, req.user!.id);
    res.status(204).send();
  })
);

// POST /tasks/:id/complete - Mark task as complete
router.post('/:id/complete',
  validateParams(UuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.completeTask(req.params.id, req.user!.id);
    res.json(task);
  })
);

// POST /tasks/:id/reopen - Reopen completed task
router.post('/:id/reopen',
  validateParams(UuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.reopenTask(req.params.id, req.user!.id);
    res.json(task);
  })
);

export default router;
